import { NextResponse } from "next/server";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(request: Request, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  if (action !== "login" && action !== "register") {
    return NextResponse.json({ error: "Unknown authentication action." }, { status: 404 });
  }

  const response = await fetch(`${backendUrl}/api/auth/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(await request.text()),
  });
  return NextResponse.json(await response.json(), { status: response.status });
}
