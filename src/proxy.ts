import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ROLE_HOME, roleForPath, type RoleName } from "@/lib/roles";

/**
 * Route-level role gate (first layer). Each dashboard prefix is reserved for exactly one role.
 * This is an optimistic check on the signed session cookie; layouts, server actions and services
 * re-check the role against the database (the authoritative layers).
 */
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const required = roleForPath(pathname);
  if (!required) return NextResponse.next();

  const token = req.cookies.get("mm_session")?.value;
  let role: RoleName | null = null;
  if (token && process.env.AUTH_SECRET) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET), { algorithms: ["HS256"] });
      role = (payload.role as RoleName) ?? null;
    } catch {
      role = null;
    }
  }

  if (!role) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  if (role !== required) {
    // Server action / API calls get a hard 403; page navigations go to the user's own dashboard.
    if (req.method !== "GET" || req.headers.get("next-action")) return new NextResponse("Forbidden", { status: 403 });
    const url = new URL("/unauthorized", req.url);
    url.searchParams.set("home", ROLE_HOME[role]);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/customer/:path*", "/farmer/:path*", "/quality/:path*", "/admin/:path*"],
};
