import { NextResponse } from "next/server";

export async function middleware(req) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-middleware-cache", "no-cache");

  try {
    const cookies = req.cookies;
    const statusCookie = cookies.get("x-site-status");

    // Only TRUE cookie means site-down
    const isSiteDownCookie = statusCookie?.value === "true";

    if (isSiteDownCookie) {
      return NextResponse.redirect(new URL("/site-down", req.url));
    }

    // Always call API for fresh status
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/user/active-status`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    const status = data.data;

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    // Reset cookie
    response.cookies.set("x-site-status", status.toString(), {
      maxAge: 60 * 60 * 24,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    // Site down? redirect
    if (status === true) {
      return NextResponse.redirect(new URL("/site-down", req.url));
    }

    return response;

  } catch (error) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }
}

export const config = {
  matcher: ["/:path*"],
};
