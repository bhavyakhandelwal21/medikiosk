export function parseModelJson(raw: string) {
  const clean = raw.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("No JSON was returned from the model.");
  }
  return JSON.parse(clean.slice(start, end + 1));
}
