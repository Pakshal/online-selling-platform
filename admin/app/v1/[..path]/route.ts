import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://backend:8000";

async function proxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const search = req.nextUrl.search ?? "";
  const target = `${BACKEND}/api/v1/${path.join("/")}${search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");

  const init: RequestInit = {
    method: req.method,
    headers,
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    // @ts-expect-error — duplex required for streaming body
    init.duplex = "half";
    init.body = req.body;
  }

  try {
    const upstream = await fetch(target, init);
    const body = await upstream.arrayBuffer();
    const resHeaders = new Headers(upstream.headers);
    resHeaders.delete("transfer-encoding"); // avoid chunked encoding issues
    return new NextResponse(body, {
      status: upstream.status,
      headers: resHeaders,
    });
  } catch (err) {
    console.error("[proxy] backend unreachable:", target, err);
    return NextResponse.json(
      { detail: "Backend service unavailable" },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const PATCH = proxy;

