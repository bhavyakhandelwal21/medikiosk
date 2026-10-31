import { NextResponse } from "next/server";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";

const LANGUAGE_MAP: Record<string, string> = {
  English: "English",
  Hindi: "Hindi",
  Tamil: "Tamil",
  Bengali: "Bengali",
  en: "English",
  hi: "Hindi",
  ta: "Tamil",
  bn: "Bengali",
};

export async function POST(request: Request) {
  try {
    const incoming = await request.formData();
    const rawLanguage = incoming.get("language");
    const language = rawLanguage ? LANGUAGE_MAP[String(rawLanguage)] ?? "English" : "English";
    const files = incoming.getAll("file");

    const formData = new FormData();
    formData.append("target_language", language);
    for (const file of files) formData.append("files", file);

    const authorization = request.headers.get("authorization");
    if (!authorization) return NextResponse.json({ error: "Please sign in before uploading documents." }, { status: 401 });
    const response = await fetch(`${backendUrl}/api/intake/documents`, { method: "POST", headers: { Authorization: authorization }, body: formData });
    const payload = await response.json();

    if (!response.ok) {
      const detail = typeof payload.detail === "string" ? payload.detail : payload.error;
      return NextResponse.json({ error: detail || "The document summarization service failed." }, { status: response.status });
    }

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backend request failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
