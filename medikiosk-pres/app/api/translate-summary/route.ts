import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const ACCEPTED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

function mimeFromName(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "heic":
      return "image/heic";
    case "heif":
      return "image/heif";
    default:
      return "";
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("file") as File[];
    const language = formData.get("language") === "hi" ? "hi" : "en";
    const languageName =
      language === "hi" ? "Hindi (Devanagari script)" : "English";

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files received." }, { status: 400 });
    }

    // Validate every file's type before sending anything to Gemini
    for (const file of files) {
      const mimeType = file.type || mimeFromName(file.name);
      if (!ACCEPTED_TYPES.has(mimeType)) {
        return NextResponse.json(
          {
            error: `"${file.name}" is not a supported file type. Please upload PDFs or images (JPG, PNG, WEBP, GIF, HEIC).`,
          },
          { status: 400 }
        );
      }
    }

    // Build one inlineData part per file
    const fileParts = await Promise.all(
      files.map(async (file) => {
        const mimeType = file.type || mimeFromName(file.name);
        const bytes = await file.arrayBuffer();
        const base64Data = Buffer.from(bytes).toString("base64");
        return {
          inlineData: {
            data: base64Data,
            mimeType,
          },
        };
      })
    );

    const promptText = `You are reading ${files.length} scanned medical document(s) belonging to the SAME patient (could be prescriptions, lab reports, or discharge summaries). 
Merge all of them into ONE combined, chronologically-aware clinical picture. 
Cross-reference information across documents (e.g. if one document mentions a diagnosis and another lists a matching medication, connect them).
Extract and return ONLY valid JSON with this structure, no extra text, no markdown formatting:
{
  "documentTypes": ["prescription" | "lab report" | "discharge summary" | "unknown", ...],
  "diagnoses": ["..."],
  "medications": [{"name": "...", "dosage": "...", "frequency": "...", "sourceDocument": "brief label e.g. Document 1"}],
  "labValues": [{"test": "...", "value": "...", "referenceRange": "...", "sourceDocument": "brief label e.g. Document 2"}],
  "summary": "a combined 2-4 sentence plain-language summary covering all documents together, noting any conflicting or duplicate information found"
}
Keep JSON keys and documentTypes enum values in English.
LANGUAGE REQUIREMENT: Write diagnoses, medication name/dosage/frequency, lab fields, sourceDocument labels, AND the summary in ${languageName}.
${
  language === "hi"
    ? `The summary MUST be written in Hindi using Devanagari script. Never write the summary in English.`
    : ""
}`;

    const result = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [...fileParts, { text: promptText }],
        },
      ],
    });

    const text = result.text ?? "";
    return NextResponse.json({ raw: text });
  } catch (err: any) {
    console.error("OCR route error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown server error" },
      { status: 500 }
    );
  }
}