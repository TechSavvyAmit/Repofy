import type { SVGProps } from "react"; import { cn } from "@/lib/utils";

type RepofyIconProps = SVGProps<SVGSVGElement> & { variant?: "color" | "mono"; };

const BRAND = "lab(35.5975% -26.6648 -4.34487)";
const ACCENT = "lab(55% -20 -5)";

export function RepofyIcon({ className, variant = "color", ...props }: RepofyIconProps) { const mono = variant === "mono";

return ( <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={cn("shrink-0", className)} {...props}><rect width="64" height="64" rx="18" fill={mono ? "currentColor" : BRAND} /><path d="M23 45V19H35C41.1 19 45 22.4 45 28C45 32.2 42.5 35.1 38.3 36.1L46 45H36.5L29.5 36.5H30.5V45H23Z" fill={mono ? "var(--background)" : "#FFFFFF"} /><path d="M30.5 25.5V30.5H34.5C36.2 30.5 37.2 29.6 37.2 28C37.2 26.4 36.2 25.5 34.5 25.5H30.5Z" fill={mono ? "currentColor" : BRAND} /><circle cx="47" cy="47" r="4" fill={mono ? "var(--background)" : ACCENT} /></svg> ); }

export function RepofyLogo({ className, ...props }: SVGProps<SVGSVGElement>) { return ( <svg viewBox="0 0 240 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={cn("shrink-0", className)} {...props}><rect width="64" height="64" rx="18" fill={BRAND} /><path d="M23 45V19H35C41.1 19 45 22.4 45 28C45 32.2 42.5 35.1 38.3 36.1L46 45H36.5L29.5 36.5H30.5V45H23Z" fill="#FFFFFF" /><path d="M30.5 25.5V30.5H34.5C36.2 30.5 37.2 29.6 37.2 28C37.2 26.4 36.2 25.5 34.5 25.5H30.5Z" fill={BRAND} /><circle cx="47" cy="47" r="4" fill={ACCENT} /><text x="80" y="43" fill="currentColor" fontFamily="Inter, ui-sans-serif, system-ui, sans-serif" fontSize="32" fontWeight="750" letterSpacing="-1.4"> Repofy </text></svg> ); }