$ErrorActionPreference = "Stop"

$repositoryRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path $repositoryRoot ".env"
$mavenWrapper = Join-Path $repositoryRoot "backend\mvnw.cmd"
$pomFile = Join-Path $repositoryRoot "backend\pom.xml"

if (-not (Test-Path -LiteralPath $envFile)) {
    throw "Root .env not found. Copy .env.example to .env and configure the required encryption values first."
}

foreach ($line in Get-Content -LiteralPath $envFile) {
    $trimmedLine = $line.Trim()
    if (-not $trimmedLine -or $trimmedLine.StartsWith("#")) {
        continue
    }

    if ($trimmedLine -notmatch '^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
        throw "Invalid .env entry. Expected KEY=VALUE."
    }

    $name = $Matches[1]
    $value = $Matches[2].Trim()
    if ($value.Length -ge 2 -and
        (($value.StartsWith('"') -and $value.EndsWith('"')) -or
         ($value.StartsWith("'") -and $value.EndsWith("'")))) {
        $value = $value.Substring(1, $value.Length - 2)
    }

    if ([Environment]::GetEnvironmentVariable($name, "Process") -eq $null) {
        Set-Item -Path "Env:$name" -Value $value
    }
}

Write-Output "Loaded local environment settings; pre-existing process environment variables take precedence."
& $mavenWrapper -f $pomFile spring-boot:run
exit $LASTEXITCODE
