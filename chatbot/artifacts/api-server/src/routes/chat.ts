import { Router, type IRouter } from "express";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface ChatRequestBody {
  messages?: unknown;
}

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are MediKiosk, an AI patient-history assistant.

Your purpose is to collect information from a patient before a consultation and organize the patient's story through a natural conversation.

You are NOT a doctor and must NOT diagnose diseases, prescribe medication, recommend treatment, or claim certainty about a medical condition.

Your job is to:
1. Understand why the patient is seeking medical care.
2. Ask clear, simple follow-up questions.
3. Collect relevant information such as the main complaint, symptoms, onset, duration, severity, location, frequency, changes over time, associated symptoms, current medications, allergies, relevant medical history, previous similar episodes, and relevant lifestyle/context information when appropriate.
4. Ask only questions that are relevant to what the patient has already told you.
5. Avoid overwhelming the patient with many questions at once.
6. Use simple, patient-friendly language and avoid unnecessary medical terminology.
7. Never invent information or assume that information the patient did not mention is absent.
8. Distinguish between information the patient explicitly provided and information that is unknown or was not asked.
9. Accept "I don't know" and continue naturally without repeatedly asking answered questions.
10. Remember earlier messages and keep the conversation natural rather than making it feel like a rigid questionnaire.

SAFETY:
If the patient describes potentially life-threatening or emergency symptoms, do not attempt to diagnose them. Clearly recommend seeking urgent/emergency medical care and keep the response concise and safety-focused. Examples include severe difficulty breathing, severe chest pain, loss of consciousness, signs of stroke, uncontrolled severe bleeding, or other symptoms that reasonably appear to require immediate emergency attention.

The doctor remains responsible for diagnosis and treatment. Your output is preliminary patient history collection only. When enough information has been collected, briefly tell the patient that the information has been recorded for the doctor and that they can continue with their consultation. Do not create a diagnosis or treatment plan.`;

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0 &&
    message.content.length <= 4000
  );
}

function getOpenAiConfig(): { baseUrl: string; apiKey: string } | null {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!apiKey) return null;

  const baseUrl =
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? "https://api.openai.com/v1";

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    apiKey,
  };
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function mockAssistantResponse(messages: ChatMessage[]) {
  const userMessages = messages
    .filter((message) => message.role === "user")
    .map((message) => message.content.trim());
  const allPatientText = userMessages.join(" ").toLowerCase();
  const latestPatientText = userMessages.at(-1)?.toLowerCase() ?? "";
  const turn = userMessages.length;

  if (
    includesAny(allPatientText, [
      "can't breathe",
      "cannot breathe",
      "severe chest pain",
      "passed out",
      "loss of consciousness",
      "uncontrolled bleeding",
      "face drooping",
      "slurred speech",
    ])
  ) {
    return "What you’re describing may need urgent attention. Please contact your local emergency services now or ask someone nearby to help you. Do not wait for this chat to respond.";
  }

  const symptomLabel =
    latestPatientText
      .replace(/^(i('| a)m|i have|i've been having|my)\s+/i, "")
      .replace(/[.!?].*$/, "")
      .slice(0, 70) || "what you’re experiencing";

  if (turn === 1) {
    return `Thank you for telling me about ${symptomLabel}. When did this start, and has it been constant or does it come and go?`;
  }

  if (
    turn === 2 &&
    !includesAny(allPatientText, [
      "medication",
      "medicine",
      "meds",
      "allerg",
      "medical history",
      "health history",
    ])
  ) {
    return "That’s helpful. How severe is it on a scale from 0 to 10, and where exactly do you feel it?";
  }

  if (turn === 3) {
    return "Have you noticed any other symptoms along with this, such as fever, nausea, dizziness, changes in your breathing, or anything else unusual?";
  }

  if (turn === 4) {
    return "Are you currently taking any medicines, vitamins, or supplements? If you don’t take anything regularly, that’s okay too.";
  }

  if (turn === 5) {
    return "Do you have any medication allergies or other allergies that your doctor should know about?";
  }

  if (turn === 6) {
    return "Do you have any medical conditions or a history of similar symptoms? You can also say that you’re not sure.";
  }

  if (turn === 7) {
    return "Has anything made the symptoms better or worse, such as food, movement, rest, or a particular time of day?";
  }

  return "Thank you. I’ve recorded what you shared for your doctor, including your symptoms, timing, severity, medicines, allergies, and medical history. Your doctor can review this information with you during the consultation.";
}

function sendMockResponse(
  res: Parameters<Parameters<IRouter["post"]>[1]>[1],
  messages: ChatMessage[],
) {
  res.json({
    message: { role: "assistant", content: mockAssistantResponse(messages) },
    mode: "mock",
  });
}

router.post("/chat", async (req, res) => {
  const body = req.body as ChatRequestBody;
  const rawMessages = body?.messages;

  if (!Array.isArray(rawMessages)) {
    res.status(400).json({ error: "Messages must be provided as an array." });
    return;
  }

  const messages = rawMessages.filter(isChatMessage);
  if (messages.length !== rawMessages.length || messages.length === 0) {
    res.status(400).json({
      error: "Please provide at least one non-empty message.",
    });
    return;
  }

  if (messages.length > 40) {
    res.status(400).json({ error: "This conversation is too long to continue." });
    return;
  }

  // Demo mode is the safe default: it never sends patient text to a paid
  // provider unless live mode is explicitly enabled by the operator.
  const config =
    process.env.MEDIKIOSK_MODE === "live" ? getOpenAiConfig() : null;
  if (!config) {
    req.log.info("MediKiosk demo mode is active; using local conversation engine");
    sendMockResponse(res, messages);
    return;
  }

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.4-mini",
        max_completion_tokens: 700,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        ],
      }),
    });

    if (!response.ok) {
      let providerError: { code?: string; type?: string } = {};
      try {
        const errorPayload = (await response.clone().json()) as {
          error?: { code?: unknown; type?: unknown };
        };
        providerError = {
          code:
            typeof errorPayload.error?.code === "string"
              ? errorPayload.error.code
              : undefined,
          type:
            typeof errorPayload.error?.type === "string"
              ? errorPayload.error.type
              : undefined,
        };
      } catch {
        // The provider response did not contain a JSON error body.
      }

      req.log.error(
        { statusCode: response.status, ...providerError },
        "OpenAI request failed",
      );

      const providerCode = providerError.code?.toLowerCase();
      const shouldUseMockMode =
        [401, 402, 403, 429].includes(response.status) ||
        providerCode === "insufficient_quota" ||
        providerCode === "billing_hard_limit_reached" ||
        providerCode === "invalid_api_key";

      if (shouldUseMockMode) {
        req.log.info("OpenAI credits or access unavailable; using demo mode");
        sendMockResponse(res, messages);
        return;
      }

      res.status(502).json({
        error:
          "I couldn't reach the patient assistant right now. Please try sending your message again.",
      });
      return;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const content = data.choices?.[0]?.message?.content;

    if (typeof content !== "string" || !content.trim()) {
      req.log.warn("OpenAI returned an empty assistant message; using demo mode");
      sendMockResponse(res, messages);
      return;
    }

    res.json({
      message: { role: "assistant", content: content.trim() },
      mode: "live",
    });
  } catch (error) {
    req.log.error({ err: error }, "Unexpected patient assistant error");
    req.log.info("OpenAI request failed; using demo mode");
    sendMockResponse(res, messages);
  }
});

export default router;