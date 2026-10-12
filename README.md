# Repofy

**Chat with your codebase.** Connect a GitHub repository, index its code, and ask questions grounded in the source.

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.1-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-Spring%20AI-412991?logo=openai&logoColor=white)](https://platform.openai.com/)

## Tech stack

- **Backend:** Java 21 and Spring Boot, with Spring AI for chat and embeddings.
- **Vector storage:** PostgreSQL 18 with the pgvector extension.
- **Authentication:** GitHub OAuth.
- **Frontend:** Next.js and React, in `client/`.

The backend stores application data and code embeddings in the same PostgreSQL database. GitHub OAuth provides repository access; Spring AI uses OpenAI for chat and embeddings.

## Prerequisites

- Windows with PowerShell 7 or later
- Docker Desktop with Docker Compose
- Java 21 or later (the backend includes the Maven wrapper)
- A GitHub OAuth App and OpenAI API key for sign-in, indexing, and chat
- Node.js 20 or later if you also want to run the frontend

## Local setup

### 1. Start PostgreSQL

Use one PostgreSQL instance on host port `5432`. If you use the supplied Docker Compose service, start it from the repository root:

```powershell
docker compose up -d postgres
```

The Compose service uses PostgreSQL 18 with pgvector, stores data in the `repofy_pg_data` named volume, and publishes container port `5432` on host port `5432`. Do not start it while another PostgreSQL service is listening on host port `5432`. If you keep an existing local PostgreSQL server on that port instead, ensure its `repofy` database exists and provision pgvector as described below.

For an existing local PostgreSQL server, run these commands from the repository root using a PostgreSQL administrator account. The first command installs the required extensions and creates the vector table; the second grants the configured application role access to that table. Replace `repofy_user` if `DB_USERNAME` in `.env` is different:

```powershell
psql -h localhost -p 5432 -U postgres -d repofy -W -f .\docker\postgress\init.extensions.sql
psql -h localhost -p 5432 -U postgres -d repofy -W -c "GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vector_store TO repofy_user;"
```

`CREATE EXTENSION vector` requires a PostgreSQL administrator. The application role must not be made a superuser. The setup script is safe to re-run: it uses `IF NOT EXISTS` for extensions and the table.

### 2. Configure the environment

Create the root `.env` file from the checked-in example:

```powershell
Copy-Item .\backend\.env.example .\.env
```

Generate two independent secure values:

```powershell
[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(8))
```

Set the first output as `TOKEN_ENCRYPTOR_PASSWORD` and the second as `TOKEN_ENCRYPTOR_SALT` in `.env`. The salt must be exactly 16 hexadecimal characters. Keep both values safe and stable: changing them prevents the app from decrypting GitHub tokens already stored in the database.

The example file uses placeholder credentials and has a database URL for port `5432`. Set `DB_URL` to:

```dotenv
DB_URL=jdbc:postgresql://localhost:5432/repofy
```

Keep `.env` private; it is ignored by Git. Never put real credentials in `.env.example`.

### 3. Configure GitHub OAuth and OpenAI

Create a GitHub OAuth App and set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `.env`. Use this authorization callback URL:

```text
http://localhost:8080/login/oauth2/code/github
```

The app requests the `read:user` and `repo` scopes. Replace `OPENAI_API_KEY` with a valid key to enable indexing, embeddings, and AI chat. Placeholder values allow configuration to load but do not enable these services.

## Environment variables

Values shown as defaults are the application defaults unless noted. The `.env.example` file may contain placeholders that you must replace for the related feature to work.

| Variable | Required | Purpose | Default |
|---|---:|---|---|
| `TOKEN_ENCRYPTOR_PASSWORD` | Yes | Encrypts stored GitHub access tokens. Generate a secure value. | None |
| `TOKEN_ENCRYPTOR_SALT` | Yes | Salt for token encryption; exactly 16 hex characters. | None |
| `DB_URL` | No | JDBC URL for the PostgreSQL database. | `jdbc:postgresql://localhost:5432/repofy` |
| `DB_USERNAME` | No | PostgreSQL user; Compose and backend use this value. | Compose: `repofy_user`; example file: `project_user` |
| `DB_PASSWORD` | No | PostgreSQL password; Compose and backend use this value. | Compose: `repofy_password`; example file: `project_password` |
| `GITHUB_CLIENT_ID` | Needed for sign-in | GitHub OAuth App client ID. | Placeholder |
| `GITHUB_CLIENT_SECRET` | Needed for sign-in | GitHub OAuth App client secret. | Placeholder |
| `OPENAI_API_KEY` | Needed for AI | OpenAI API key used for chat and embeddings. | Placeholder |
| `OPENAI_CHAT_MODEL` | No | Chat model. | `gpt-3.5-turbo` |
| `OPENAI_CHAT_MAX_TOKENS` | No | Chat response token limit. | `2048` |
| `OPENAI_CHAT_TEMPERATURE` | No | Chat response temperature. | `0.7` |
| `OPENAI_CHAT_TOP_P` | No | Chat nucleus sampling setting. | `1.0` |
| `OPENAI_EMBEDDING_MODEL` | No | Embedding model. | `text-embedding-3-small` |
| `OPENAI_EMBEDDING_MAX_TOKENS` | No | Embedding input token limit. | `8191` |
| `FRONTEND_URL` | No | Frontend URL for OAuth redirects. | `http://localhost:3000` |
| `CORS_ALLOWED_ORIGINS` | No | Comma-separated browser origins allowed by the backend. | `http://localhost:3000` |

## Run the application

At the repository root, start the backend with the launcher:

```powershell
.\run-backend.ps1
```

The script loads root `.env` values into the Maven process, while preserving any variables already set in the process environment. It then runs `backend\mvnw.cmd spring-boot:run`. IDE run buttons do not automatically load the root `.env`; use this script from the IDE terminal or configure the environment variables in your IDE run configuration.

To run the frontend in a separate terminal:

```powershell
Set-Location .\client
npm install
npm run dev
```

## Verify the backend

Once the backend is running, check its public login URL endpoint:

```powershell
(Invoke-RestMethod http://localhost:8080/api/auth/login-url).url
```

It should return `/oauth2/authorization/github`.

## Troubleshooting

- **Missing encryption password:** set `TOKEN_ENCRYPTOR_PASSWORD` in `.env` or the process environment.
- **Invalid encryption salt:** provide exactly 16 hexadecimal characters for `TOKEN_ENCRYPTOR_SALT`.
- **GitHub sign-in fails:** replace both OAuth placeholders and verify the callback URL is exactly `http://localhost:8080/login/oauth2/code/github`.
- **Indexing or chat fails:** set a valid `OPENAI_API_KEY` and confirm the configured models are available to your account.
- **Database connection fails:** ensure PostgreSQL is healthy on host port `5432` and `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` match `.env`. The Compose service publishes container port `5432` on host port `5432`; stop or reconfigure any other service already using that host port before starting it.
- **IDE starts without configuration:** run `.\run-backend.ps1` from the integrated terminal, or add the root `.env` values to the IDE run configuration.
