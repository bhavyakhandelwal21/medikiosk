import { NextResponse } from "next/server";

const chatbotUrl = process.env.CHATBOT_URL ?? "http://localhost:3001";

type ChatMessage = { role: "user" | "assistant"; content: string };

function mockReply(messages: ChatMessage[]) {
  const patientMessages = messages.filter((message) => message.role === "user");
  const allText = patientMessages.map((message) => message.content.toLowerCase()).join(" ");
  if (["can't breathe", "cannot breathe", "severe chest pain", "passed out", "uncontrolled bleeding", "face drooping", "slurred speech"].some((term) => allText.includes(term))) {
    return "What you’re describing may need urgent attention. Please contact your local emergency services now or ask someone nearby to help you. Do not wait for this chat to respond.";
  }
  const questions = [
    "Got it. Roughly when did you first notice these symptoms starting?",
    "On a scale of 1 to 10, how severe would you say it is, and exactly where is the discomfort located?",
    "Are you experiencing any other accompanying symptoms along with this?",
    "Are you currently taking any regular medications, supplements, or over-the-counter remedies?",
    "Do you have any known drug allergies or adverse reactions?",
    "Is there any relevant past medical history or previous surgery we should note down?",
  ];
  return questions[patientMessages.length - 1] ?? "Thank you. I’ve structured your clinical history for your doctor. You can continue with your consultation.";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { messages?: ChatMessage[] };
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: "Messages must be provided as an array." }, { status: 400 });
    }

    try {
      const response = await fetch(`${chatbotUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: body.messages }),
        signal: AbortSignal.timeout(2500),
      });
      if (response.ok) return NextResponse.json(await response.json());
    } catch {
      // The standalone chatbot server is optional when using the integrated app.
    }

    return NextResponse.json({ message: { role: "assistant", content: mockReply(body.messages), }, mode: "integrated-demo" });
  } catch {
    return NextResponse.json({ error: "The patient assistant is unavailable. Please try again." }, { status: 502 });
  }
}
