import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import axios from "axios";

const Role = {
  Admin: "Admin",
  Manager: "Manager",
  Sales: "Sales",
  ProductManager: "ProductManager",
};

export async function middleware(request) {
  try {
    const { pathname } = request.nextUrl;
    const accessToken = request.cookies.get("accessToken")?.value;

    if (!accessToken) {
      if (pathname !== "/" && pathname !== "/inactive") {
        return NextResponse.redirect(new URL("/", request.url));
      }
      return NextResponse.next();
    }

    let decodedToken;
    try {
      decodedToken = jwt.decode(accessToken);
    } catch (error) {
      console.error("Invalid token:", error);
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Check active status
    const activeStatusResponse = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/user/active-status`,
      {
        headers: {
          Cookie: `accessToken=${accessToken}`,
        },
      }
    );

    const isActive = activeStatusResponse.data;

    if (!isActive) {
      if (pathname !== "/inactive") {
        return NextResponse.redirect(new URL("/inactive", request.url));
      }
      return NextResponse.next();
    } else {
      if (pathname === "/inactive") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    const userRole = decodedToken.role;

    const roleAccess = {
      [Role.Admin]: /.*/,
      [Role.Manager]: /^(?!\/dashboard\/create-role).*$/,
      [Role.Sales]: /^\/dashboard(\/leads(\/add-leads)?|\/add-lead)?$/,
      [Role.ProductManager]:
        /^\/dashboard(\/products(\/add-product|\/category-manage|\/[^\/]+)?|\/category-manage)?$/,
    };

    roleAccess[Role.Admin] = new RegExp(
      roleAccess[Role.Admin].source + "|^/dashboard/banner$"
    );
    roleAccess[Role.Manager] = new RegExp(
      roleAccess[Role.Manager].source + "|^/dashboard/banner$"
    );

    roleAccess[Role.Manager] = new RegExp(
      roleAccess[Role.Manager].source +
        "|" +
        roleAccess[Role.Sales].source +
        "|" +
        roleAccess[Role.ProductManager].source
    );

    const isAuthorized = roleAccess[userRole]?.test(pathname);

    if (pathname === "/" && accessToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (!isAuthorized) {
      if (pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } else {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
