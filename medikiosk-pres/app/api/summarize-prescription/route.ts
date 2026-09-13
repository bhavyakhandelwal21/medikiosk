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

    if (files.length === 0) {
      return NextResponse.json({ error: "At least one file is required." }, { status: 400 });
    }

    const formData = new FormData();
    formData.append("target_language", language);
    for (const file of files) formData.append("files", file);

    const response = await fetch(`${backendUrl}/api/intake/documents`, { method: "POST", body: formData });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backend request failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
