import { NextResponse } from "next/server";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization) return NextResponse.json({ detail: "Please sign in before viewing prescriptions." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const response = await fetch(`${backendUrl}/api/prescriptions`, { cache: "no-store", headers: { Authorization: authorization } });
  return NextResponse.json(await response.json(), { status: response.status, headers: { "Cache-Control": "no-store" } });
}
