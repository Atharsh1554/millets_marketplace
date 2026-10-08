// Client-safe role → dashboard mapping. Each role may only use its own dashboard prefix.

export type RoleName = "CUSTOMER" | "FARMER" | "QUALITY_TEAM" | "ADMIN";

export const ROLE_HOME: Record<RoleName, string> = {
  CUSTOMER: "/customer",
  FARMER: "/farmer",
  QUALITY_TEAM: "/quality",
  ADMIN: "/admin",
};

/** Dashboard prefix → the single role allowed to open it. */
export const PREFIX_ROLE: Array<[string, RoleName]> = [
  ["/customer", "CUSTOMER"],
  ["/farmer", "FARMER"],
  ["/quality", "QUALITY_TEAM"],
  ["/admin", "ADMIN"],
];

export function roleForPath(pathname: string): RoleName | null {
  for (const [prefix, role] of PREFIX_ROLE) if (pathname === prefix || pathname.startsWith(prefix + "/")) return role;
  return null;
}
