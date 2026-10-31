import { NextResponse } from "next/server";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authorization = _request.headers.get("authorization");
    if (!authorization) return NextResponse.json({ detail: "Please sign in before deleting prescriptions." }, { status: 401 });
    const response = await fetch(`${backendUrl}/api/prescriptions/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
    });

    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete request failed.";
    return NextResponse.json({ detail: message }, { status: 502 });
  }
}
