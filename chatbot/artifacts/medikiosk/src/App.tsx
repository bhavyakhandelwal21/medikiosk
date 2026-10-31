import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileText,
  HeartPulse,
  History,
  Menu,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

type MessageRole = "assistant" | "user";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
}

const STORAGE_KEY = "medikiosk-patient-assistant-v1";
const HISTORY_STORAGE_KEY = "medikiosk-patient-history-v1";

const WELCOME_MESSAGES = {
  en: "Hello, I'm MediKiosk's patient assistant. I'll ask you a few questions about how you're feeling so we can prepare a brief history for your doctor. What symptoms are you facing currently? Please answer in your own words. If you don't know something, that's completely okay.",
  hi: "नमस्ते, मैं मेडिकिओस्क का रोगी सहायक हूँ। मैं आपके स्वास्थ्य के बारे में कुछ प्रश्न पूछूँगा ताकि हम आपके डॉक्टर के लिए एक संक्षिप्त विवरण तैयार कर सकें। आपको अभी क्या लक्षण (symptoms) महसूस हो रहे हैं? कृपया अपने शब्दों में उत्तर दें। यदि आपको कुछ पता न हो, तो पूरी तरह से ठीक है।",
};

type HistoryFieldKey =
  | "reasonForVisit"
  | "timeline"
  | "severityLocation"
  | "otherSymptoms"
  | "medications"
  | "allergies"
  | "medicalHistory"
  | "triggersRelief";

interface PatientHistory {
  reasonForVisit: string;
  timeline: string;
  severityLocation: string;
  otherSymptoms: string;
  medications: string;
  allergies: string;
  medicalHistory: string;
  triggersRelief: string;
  responseCount: number;
  updatedAt: string;
}

type HistoryOverrides = Partial<Record<HistoryFieldKey, string>>;

const HISTORY_FIELD_ORDER: HistoryFieldKey[] = [
  "reasonForVisit",
  "timeline",
  "severityLocation",
  "otherSymptoms",
  "medications",
  "allergies",
  "medicalHistory",
  "triggersRelief",
];

const HISTORY_FIELDS: Array<{ key: HistoryFieldKey; label: { en: string; hi: string } }> = [
  { key: "reasonForVisit", label: { en: "Main concern", hi: "मुख्य चिंता" } },
  { key: "timeline", label: { en: "When it started", hi: "यह कब शुरू हुआ" } },
  { key: "severityLocation", label: { en: "Severity and location", hi: "गंभीरता और स्थान" } },
  { key: "otherSymptoms", label: { en: "Other symptoms", hi: "अन्य लक्षण" } },
  { key: "medications", label: { en: "Medications and supplements", hi: "दवाइयां और सप्लीमेंट्स" } },
  { key: "allergies", label: { en: "Allergies", hi: "एलर्जी" } },
  { key: "medicalHistory", label: { en: "Medical history", hi: "चिकित्सा इतिहास" } },
  { key: "triggersRelief", label: { en: "What helps or worsens it", hi: "क्या मदद करता है या स्थिति बिगाड़ता है" } },
];

function emptyPatientHistory(): PatientHistory {
  return {
    reasonForVisit: "",
    timeline: "",
    severityLocation: "",
    otherSymptoms: "",
    medications: "",
    allergies: "",
    medicalHistory: "",
    triggersRelief: "",
    responseCount: 0,
    updatedAt: "",
  };
}

function getStoredHistory(): PatientHistory {
  try {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (saved) {
      return { ...emptyPatientHistory(), ...(JSON.parse(saved) as Partial<PatientHistory>) };
    }
  } catch {
    // Start with an empty history when local storage is unavailable or corrupted.
  }
  return emptyPatientHistory();
}

function getStoredHistoryOverrides(): HistoryOverrides {
  try {
    const saved = localStorage.getItem(`${HISTORY_STORAGE_KEY}-overrides`);
    if (saved) return JSON.parse(saved) as HistoryOverrides;
  } catch {
    // Start without overrides when local storage is unavailable or corrupted.
  }
  return {};
}

function buildPatientHistory(messages: Message[], overrides: HistoryOverrides = {}): PatientHistory {
  const patientResponses = messages
    .filter((message) => message.role === "user")
    .map((message) => message.content.trim())
    .filter(Boolean);
  const history = emptyPatientHistory();
  patientResponses.forEach((response, index) => {
    const field = HISTORY_FIELD_ORDER[index];
    if (field) history[field] = response;
  });

  const keywordFields: Array<{ key: HistoryFieldKey; terms: string[] }> = [
    { key: "medications", terms: ["medication", "medicine", "meds", "supplement", "tablet", "pill", "दवा", "गोली"] },
    { key: "allergies", terms: ["allerg", "reaction to", "एलर्जी"] },
    { key: "medicalHistory", terms: ["medical history", "health history", "diagnosed", "condition", "surgery", "इतिहास", "सर्जरी"] },
    { key: "severityLocation", terms: ["out of 10", "/10", "mild", "moderate", "severe", "pain in", "pain on", "दर्द", "गंभीर"] },
    { key: "triggersRelief", terms: ["better", "worse", "relief", "trigger", "after eating", "when i move", "आराम"] },
  ];

  keywordFields.forEach(({ key, terms }) => {
    const matchingResponse = [...patientResponses]
      .reverse()
      .find((response) => terms.some((term) => response.toLowerCase().includes(term)));
    if (matchingResponse) history[key] = matchingResponse;
  });

  history.responseCount = patientResponses.length;
  history.updatedAt = patientResponses.length
    ? messages.filter((message) => message.role === "user").at(-1)?.timestamp ?? ""
    : "";

  Object.entries(overrides).forEach(([key, value]) => {
    if (value && HISTORY_FIELD_ORDER.includes(key as HistoryFieldKey)) {
      history[key as HistoryFieldKey] = value;
    }
  });

  return history;
}

function makeMessage(role: MessageRole, content: string): Message {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
    timestamp: new Date().toISOString(),
  };
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function getSpeechText(content: string) {
  return content
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getPreferredVoice(voices: SpeechSynthesisVoice[], language: "en" | "hi") {
  if (language === "hi") {
    return (
      voices.find((voice) => /^hi[-_]IN$/i.test(voice.lang)) ??
      voices.find((voice) => /hindi/i.test(`${voice.name} ${voice.lang}`)) ??
      voices.find((voice) => /^hi[-_]/i.test(voice.lang))
    );
  }
  return (
    voices.find((voice) => /^en[-_]IN$/i.test(voice.lang)) ??
    voices.find((voice) => /english.*india|india.*english|ravi|heera/i.test(`${voice.name} ${voice.lang}`)) ??
    voices.find(
      (voice) =>
        /^en[-_]/i.test(voice.lang) &&
        /natural|premium|enhanced|google|siri|microsoft/i.test(voice.name),
    ) ??
    voices.find((voice) => /^en[-_]/i.test(voice.lang))
  );
}

function App() {
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved) as Message[];
    } catch {
      // Start fresh when local storage is unavailable or corrupted.
    }
    return [makeMessage("assistant", WELCOME_MESSAGES.en)];
  });
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [patientHistory, setPatientHistory] = useState<PatientHistory>(getStoredHistory);
  const [historyOverrides, setHistoryOverrides] = useState<HistoryOverrides>(getStoredHistoryOverrides);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageDraft, setEditingMessageDraft] = useState("");
  const [editingHistoryField, setEditingHistoryField] = useState<HistoryFieldKey | null>(null);
  const [editingHistoryDraft, setEditingHistoryDraft] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const messagesContainer = useRef<HTMLDivElement>(null);
  const endOfMessages = useRef<HTMLDivElement>(null);
  const activeSpeechId = useRef<string | null>(null);

  useEffect(() => {
    if (messages.length === 1 && messages[0].role === "assistant") {
      setMessages([makeMessage("assistant", WELCOME_MESSAGES[language])]);
    }
  }, [language]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    const nextHistory = buildPatientHistory(messages, historyOverrides);
    setPatientHistory(nextHistory);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
    localStorage.setItem(`${HISTORY_STORAGE_KEY}-overrides`, JSON.stringify(historyOverrides));
    messagesContainer.current?.scrollTo({
      top: messagesContainer.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, historyOverrides, isLoading]);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      "SpeechSynthesisUtterance" in window;
    setSpeechSupported(supported);

    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, []);

  function toggleSpeech(message: Message) {
    if (!speechSupported || !("speechSynthesis" in window)) return;

    if (activeSpeechId.current === message.id) {
      activeSpeechId.current = null;
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(getSpeechText(message.content));
    const targetVoice = getPreferredVoice(window.speechSynthesis.getVoices(), language);

    utterance.lang = language === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 0.94;
    utterance.pitch = 1;
    utterance.volume = 1;
    if (targetVoice) utterance.voice = targetVoice;
    activeSpeechId.current = message.id;
    setSpeakingMessageId(message.id);
    utterance.onend = () => {
      if (activeSpeechId.current === message.id) {
        activeSpeechId.current = null;
        setSpeakingMessageId(null);
      }
    };
    utterance.onerror = () => {
      if (activeSpeechId.current === message.id) {
        activeSpeechId.current = null;
        setSpeakingMessageId(null);
      }
    };
    window.speechSynthesis.speak(utterance);
  }

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault();
    const content = draft.trim();
    if (!content || isLoading) return;

    const nextMessages = [...messages, makeMessage("user", content)];
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 700));

      const userTurnCount = nextMessages.filter((m) => m.role === "user").length;
      let replyText = "";

      if (userTurnCount === 1) {
        replyText = language === "hi"
          ? "समझ गया। लगभग कब से आपको ये लक्षण महसूस होने लगे?"
          : "Got it. Roughly when did you first notice these symptoms starting?";
      } else if (userTurnCount === 2) {
        replyText = language === "hi"
          ? "1 से 10 के पैमाने पर, यह कितना गंभीर है और दर्द कहाँ है?"
          : "On a scale of 1 to 10, how severe would you say it is, and exactly where is the discomfort located?";
      } else if (userTurnCount === 3) {
        replyText = language === "hi"
          ? "क्या आपको इसके साथ कोई अन्य लक्षण भी महसूस हो रहे हैं?"
          : "Are you experiencing any other accompanying symptoms along with this?";
      } else if (userTurnCount === 4) {
        replyText = language === "hi"
          ? "क्या आप वर्तमान में कोई नियमित दवाइयां या सप्लीमेंट्स ले रहे हैं?"
          : "Are you currently taking any regular medications, supplements, or over-the-counter remedies?";
      } else if (userTurnCount === 5) {
        replyText = language === "hi"
          ? "क्या आपको दवाइयों से कोई ज्ञात एलर्जी या प्रतिक्रिया है?"
          : "Do you have any known drug allergies or adverse reactions?";
      } else if (userTurnCount === 6) {
        replyText = language === "hi"
          ? "क्या कोई पुराना चिकित्सा इतिहास या पिछली सर्जरी है जिसके बारे में हमें जानना चाहिए?"
          : "Is there any relevant past medical history or previous surgeries we should note down?";
      } else {
        replyText = language === "hi"
          ? "धन्यवाद! मैंने आपकी नैदानिक जानकारी तैयार कर ली है। डॉक्टर से मिलने से पहले आप दाईं ओर 'आपकी विज़िट का इतिहास' पर क्लिक करके सब कुछ देख सकते हैं।"
          : "Thank you! I've structured your clinical history. You can review everything by clicking 'Your visit history' on the right panel before seeing your doctor.";
      }

      setMessages((current) => [...current, makeMessage("assistant", replyText)]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : (language === "hi" ? "सहायक उत्तर नहीं दे सका। कृपया पुनः प्रयास करें।" : "The assistant could not respond. Please try again."),
      );
    } finally {
      setIsLoading(false);
    }
  }

  function startEditingMessage(message: Message) {
    setEditingMessageId(message.id);
    setEditingMessageDraft(message.content);
  }

  function cancelEditingMessage() {
    setEditingMessageId(null);
    setEditingMessageDraft("");
  }

  function saveEditedMessage(messageId: string) {
    const content = editingMessageDraft.trim();
    if (!content) return;

    setMessages((current) =>
      current.map((message) =>
        message.id === messageId ? { ...message, content } : message,
      ),
    );
    setHistoryOverrides({});
    cancelEditingMessage();
  }

  function startEditingHistoryField(key: HistoryFieldKey) {
    setEditingHistoryField(key);
    setEditingHistoryDraft(patientHistory[key]);
  }

  function cancelEditingHistoryField() {
    setEditingHistoryField(null);
    setEditingHistoryDraft("");
  }

  function saveEditedHistoryField(key: HistoryFieldKey) {
    const value = editingHistoryDraft.trim();
    if (!value) return;

    setHistoryOverrides((current) => ({ ...current, [key]: value }));
    setPatientHistory((current) => ({ ...current, [key]: value }));
    cancelEditingHistoryField();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  function restartConversation() {
    const welcome = language === "hi" ? WELCOME_MESSAGES.hi : WELCOME_MESSAGES.en;
    setMessages([makeMessage("assistant", welcome)]);
    setPatientHistory(emptyPatientHistory());
    setHistoryOverrides({});
    setEditingMessageId(null);
    setEditingHistoryField(null);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    localStorage.removeItem(`${HISTORY_STORAGE_KEY}-overrides`);
    setDraft("");
    setError("");
    setShowHistory(false);
  }

  function clearConversation() {
    const confirmText = language === "hi" 
      ? "क्या आप इस बातचीत को साफ़ करके नए सिरे से शुरू करना चाहते हैं?"
      : "Clear this conversation and start over?";
    if (window.confirm(confirmText)) {
      restartConversation();
    }
  }

  function goToMainDashboard() {
    // Return using referrer if navigated from index7Ui.html
    if (document.referrer && (document.referrer.includes("index7Ui.html") || document.referrer.includes("index7ui.html"))) {
      window.location.href = document.referrer;
      return;
    }

    // Fallback using browser history
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    // Direct fallback if opened directly
    if (window.location.protocol === "file:") {
      window.location.href = "./index7Ui.html";
    } else {
      window.location.href = "http://127.0.0.1:5500/index7Ui.html";
    }
  }

  const userMessageCount = messages.filter((message) => message.role === "user").length;

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <a className="brand" onClick={goToMainDashboard} style={{ cursor: "pointer" }} aria-label="MediKiosk home">
          <span className="brand-mark">
            <HeartPulse size={20} strokeWidth={2.5} />
          </span>
          <span>
            <strong>MEDIKIOSK</strong>
            <small>{language === "hi" ? "एआई-संचालित नैदानिक इतिहास" : "AI-POWERED CLINICAL HISTORY"}</small>
          </span>
        </a>

        <div className="topbar-actions">
          <button 
            onClick={goToMainDashboard} 
            className="help-button" 
            title="Return to Main Dashboard"
            type="button"
          >
            <ArrowLeft size={16} />
            <span>{language === "hi" ? "मुख्य डैशबोर्ड पर जाएं" : "To main dashboard"}</span>
          </button>
          <button 
            className="help-button" 
            onClick={() => setLanguage(language === "en" ? "hi" : "en")}
            type="button"
          >
            <span>{language === "en" ? "🇮🇳 हिंदी" : "🇬🇧 English"}</span>
          </button>
          <button className="help-button" onClick={() => setShowHelp(true)}>
            <CircleHelp size={16} />
            <span>{language === "hi" ? "सहायता" : "Help"}</span>
          </button>
          <button className="icon-button mobile-menu" aria-label="Open menu">
            <Menu size={20} />
          </button>
          <button className="avatar-button" aria-label="Patient menu">
            <span>PS</span>
            <ChevronDown size={14} />
          </button>
        </div>
      </header>

      <div className="page-layout">
        <aside className="left-rail">
          <div className="rail-kicker">{language === "hi" ? "आपकी यात्रा" : "YOUR VISIT"}</div>
          <div className="rail-progress">
            <div className="progress-track">
              <span style={{ height: `${Math.min(88, 26 + userMessageCount * 9)}%` }} />
            </div>
            <div>
              <strong>{userMessageCount === 0 ? (language === "hi" ? "शुरू हो रहा है" : "Getting started") : (language === "hi" ? "इतिहास प्रगति पर है" : "History in progress")}</strong>
              <span>{userMessageCount === 0 ? (language === "hi" ? "कुछ ही मिनट" : "A few minutes") : (language === "hi" ? "अपनी गति से जारी रखें" : "Keep going at your pace")}</span>
            </div>
          </div>

          <div className="rail-divider" />
          <div className="rail-kicker">{language === "hi" ? "क्या अपेक्षा करें" : "WHAT TO EXPECT"}</div>
          <ul className="expect-list">
            <li><span className="expect-icon"><Stethoscope size={15} /></span><span>{language === "hi" ? "बताएं कि आप किस समस्या के लिए आए हैं" : "Share what brought you in"}</span></li>
            <li><span className="expect-icon"><Clock3 size={15} /></span><span>{language === "hi" ? "सामान्य फॉलो-अप प्रश्नों के उत्तर दें" : "Answer simple follow-up questions"}</span></li>
            <li><span className="expect-icon"><FileText size={15} /></span><span>{language === "hi" ? "अपने डॉक्टर के साथ समीक्षा करें" : "Review with your doctor"}</span></li>
          </ul>

          <div className="rail-footer">
            <ShieldCheck size={17} />
            <span>{language === "hi" ? "आपके उत्तर गोपनीय हैं और आपकी यात्रा की तैयारी के लिए उपयोग किए जाते हैं।" : "Your answers are private and used to prepare for your visit."}</span>
          </div>
        </aside>

        <section className="assistant-panel" aria-label="Patient assistant conversation">
          <div className="conversation-heading">
            <div>
              <p className="eyebrow">{language === "hi" ? "विज़िट-पूर्व चेक-इन • चरण 01" : "PRE-VISIT CHECK-IN • STEP 01"}</p>
              <h1>{language === "hi" ? "आइए समझें कि आप कैसा महसूस कर रहे हैं।" : "Let's understand how you're feeling."}</h1>
              <p className="heading-copy">{language === "hi" ? "अपना समय लें। उत्तर देने का कोई गलत तरीका नहीं है।" : "Take your time. There's no right or wrong way to answer."}</p>
            </div>
            <div className="heading-actions">
              <button className="quiet-button" onClick={restartConversation}><RotateCcw size={15} /> {language === "hi" ? "पुनः आरंभ" : "Restart"}</button>
              <button className="quiet-button danger-quiet" onClick={clearConversation}><Trash2 size={15} /> {language === "hi" ? "साफ़ करें" : "Clear"}</button>
              <button className="quiet-button mobile-history-button" onClick={() => setShowHistory(true)}><History size={15} /> {language === "hi" ? "इतिहास" : "History"}</button>
            </div>
          </div>

          <div className="conversation-card">
            <div className="conversation-toolbar">
              <div className="assistant-identity">
                <span className="assistant-orb"><Sparkles size={17} /></span>
                <div><strong>{language === "hi" ? "मेडिकिओस्क सहायक" : "MediKiosk Assistant"}</strong><span><i /> {language === "hi" ? "आपकी सहायता के लिए तैयार" : "Ready when you are"}</span></div>
              </div>
              <button className="icon-button" aria-label="Conversation options"><MoreHorizontal size={19} /></button>
            </div>

            <div ref={messagesContainer} className="messages" role="log" aria-live="polite">
              <div className="date-rule"><span>{language === "hi" ? "आज" : "Today"}</span></div>
              {messages.map((message) => (
                <div className={`message-row ${message.role}`} key={message.id}>
                  {message.role === "assistant" && <span className="message-avatar"><HeartPulse size={15} /></span>}
                  <div className="message-stack">
                    {editingMessageId === message.id ? (
                      <div className="message-edit-card">
                        <textarea
                          value={editingMessageDraft}
                          onChange={(event) => setEditingMessageDraft(event.target.value)}
                          aria-label="Edit your message"
                          autoFocus
                        />
                        <div className="edit-actions">
                          <button className="edit-cancel-button" type="button" onClick={cancelEditingMessage}>{language === "hi" ? "रद्द करें" : "Cancel"}</button>
                          <button className="edit-save-button" type="button" onClick={() => saveEditedMessage(message.id)} disabled={!editingMessageDraft.trim()}>
                            <Check size={15} /> {language === "hi" ? "सहेजें" : "Save"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="message-bubble">{message.content}</div>
                    )}
                    <div className="message-meta">
                      <time>{formatTime(message.timestamp)}</time>
                      {message.role === "user" && editingMessageId !== message.id && (
                        <button
                          className="edit-message-button"
                          type="button"
                          onClick={() => startEditingMessage(message)}
                          title="Edit your message"
                          aria-label="Edit your message"
                        >
                          <Pencil size={16} />
                          <span>{language === "hi" ? "संपादित करें" : "Edit"}</span>
                        </button>
                      )}
                      {message.role === "assistant" && speechSupported && (
                        <button
                          className={`speech-button ${speakingMessageId === message.id ? "speaking" : ""}`}
                          type="button"
                          onClick={() => toggleSpeech(message)}
                          title={speakingMessageId === message.id ? "Stop reading this response" : "Listen to this response"}
                          aria-label={speakingMessageId === message.id ? "Stop reading this response" : "Listen to this response"}
                        >
                          {speakingMessageId === message.id ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                      )}
                    </div>
                  </div>
                  {message.role === "user" && <span className="message-avatar patient-avatar">PS</span>}
                </div>
              ))}
              {isLoading && (
                <div className="message-row assistant">
                  <span className="message-avatar"><HeartPulse size={15} /></span>
                  <div className="message-stack"><div className="message-bubble typing"><span /><span /><span /></div><span className="typing-label">{language === "hi" ? "मेडिकिओस्क सोच रहा है…" : "MediKiosk is thinking…"}</span></div>
                </div>
              )}
              <div ref={endOfMessages} />
            </div>

            {error && <div className="error-banner" role="alert"><CircleHelp size={17} /><span>{error}</span><button onClick={() => setError("")}><X size={15} /></button></div>}

            <form className="composer" onSubmit={sendMessage}>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={language === "hi" ? "यहाँ अपना उत्तर टाइप करें…" : "Type your answer here…"}
                rows={2}
                disabled={isLoading}
                aria-label="Your answer"
              />
              <div className="composer-bottom">
                <span><kbd>Enter</kbd> {language === "hi" ? "भेजने के लिए" : "to send"} <kbd>Shift + Enter</kbd> {language === "hi" ? "नई लाइन के लिए" : "for a new line"}</span>
                <button className="send-button" disabled={!draft.trim() || isLoading} aria-label="Send message"><Send size={17} /><span>{language === "hi" ? "भेजें" : "Send"}</span><ArrowUpRight size={15} /></button>
              </div>
            </form>
          </div>

          <p className="disclaimer"><ShieldCheck size={14} /> {language === "hi" ? "यह सहायक आपके डॉक्टर के लिए जानकारी एकत्र करता है। यह बीमारियों का निदान नहीं करता है।" : "This assistant collects information for your doctor. It does not diagnose conditions or replace medical advice."}</p>
        </section>

        <aside className="right-rail">
          <button className="side-card" type="button" onClick={() => setShowHistory(true)} aria-haspopup="dialog">
            <div className="side-card-icon"><History size={17} /></div>
            <div>
              <strong>{language === "hi" ? "आपकी विज़िट का इतिहास" : "Your visit history"}</strong>
              <p>{patientHistory.responseCount > 0
                ? `${patientHistory.responseCount} ${language === "hi" ? "प्रतिक्रिया सहेजी गई" : `patient response${patientHistory.responseCount === 1 ? "" : "s"} saved`}`
                : (language === "hi" ? "आपकी बातचीत यहाँ व्यवस्थित की जाएगी।" : "Your conversation will be organized here.")}</p>
              <span className="side-card-action">{language === "hi" ? "इतिहास खोलें" : "Open history"} <ArrowUpRight size={14} /></span>
            </div>
          </button>
          <div className="side-note">
            <span className="note-line" />
            <div><strong>{language === "hi" ? "तत्काल सहायता चाहिए?" : "Need immediate help?"}</strong><p>{language === "hi" ? "यदि आपको सीने में गंभीर दर्द, सांस लेने में तकलीफ या अत्यधिक रक्तस्राव हो रहा है, तो तुरंत आपातकालीन नंबर पर कॉल करें।" : "If you have severe chest pain, trouble breathing, signs of a stroke, or uncontrolled bleeding, call your local emergency number now."}</p></div>
          </div>
        </aside>
      </div>

      {showHelp && <div className="modal-backdrop" onClick={() => setShowHelp(false)}><div className="help-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setShowHelp(false)} aria-label="Close help"><X size={18} /></button><span className="modal-icon"><CircleHelp size={21} /></span><h2>{language === "hi" ? "यह कैसे काम करता है" : "How this works"}</h2><p>{language === "hi" ? "मेडिकिओस्क आपके लक्षणों और स्वास्थ्य इतिहास के बारे में कुछ प्रासंगिक प्रश्न पूछता है। आपके उत्तर डॉक्टर को आपकी यात्रा से पहले तैयारी करने में मदद करते हैं।" : "MediKiosk asks a few relevant questions about your symptoms and history. Your answers help your doctor prepare before your visit."}</p><p>{language === "hi" ? "यदि आप किसी चिकित्सीय आपातकाल का अनुभव कर रहे हैं, तो यहाँ प्रतीक्षा करने के बजाय अपनी स्थानीय आपातकालीन सेवाओं से संपर्क करें।" : "If you're experiencing a medical emergency, contact your local emergency services instead of waiting for a response here."}</p><button className="modal-action" onClick={() => setShowHelp(false)}>{language === "hi" ? "समझ गया" : "Got it"}</button></div></div>}
      {showHistory && (
        <div className="modal-backdrop" onClick={() => setShowHistory(false)}>
          <section className="history-modal" role="dialog" aria-modal="true" aria-labelledby="history-title" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowHistory(false)} aria-label="Close visit history"><X size={18} /></button>
            <span className="modal-icon history-icon"><History size={21} /></span>
            <p className="modal-eyebrow">{language === "hi" ? "आपकी यात्रा" : "YOUR VISIT"}</p>
            <h2 id="history-title">{language === "hi" ? "आपकी विज़िट का इतिहास" : "Your visit history"}</h2>
            <p className="history-intro">{language === "hi" ? "इस बातचीत में आपके द्वारा साझा की गई जानकारी का एक संरचित सारांश। इसे इस विज़िट के लिए इस डिवाइस पर सहेजा गया है।" : "A structured summary of what you have shared during this conversation. It is saved on this device for this visit."}</p>
            <div className="history-grid">
              {HISTORY_FIELDS.map(({ key, label }) => (
                <div className="history-item" key={key}>
                  <div className="history-item-heading">
                    <span>{label[language]}</span>
                    <button
                      className="history-edit-button"
                      type="button"
                      onClick={() => startEditingHistoryField(key)}
                      title={`Edit ${label.en.toLowerCase()}`}
                      aria-label={`Edit ${label.en.toLowerCase()}`}
                    >
                      <Pencil size={15} />
                    </button>
                  </div>
                  {editingHistoryField === key ? (
                    <>
                      <textarea
                        className="history-edit-input"
                        value={editingHistoryDraft}
                        onChange={(event) => setEditingHistoryDraft(event.target.value)}
                        aria-label={`Edit ${label.en.toLowerCase()}`}
                        autoFocus
                      />
                      <div className="history-edit-actions">
                        <button className="edit-cancel-button" type="button" onClick={cancelEditingHistoryField}>{language === "hi" ? "रद्द करें" : "Cancel"}</button>
                        <button className="edit-save-button" type="button" onClick={() => saveEditedHistoryField(key)} disabled={!editingHistoryDraft.trim()}>
                          <Check size={14} /> {language === "hi" ? "सहेजें" : "Save"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <p>{patientHistory[key] || (language === "hi" ? "अभी साझा नहीं किया गया" : "Not shared yet")}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="history-footer">
              <ShieldCheck size={16} />
              <span>{patientHistory.responseCount} {language === "hi" ? "प्रतिक्रिया स्थानीय रूप से सहेजी गई" : `response${patientHistory.responseCount === 1 ? "" : "s"} saved locally`}</span>
            </div>
            <button className="modal-action" onClick={() => setShowHistory(false)}>{language === "hi" ? "बातचीत पर वापस जाएं" : "Back to conversation"}</button>
          </section>
        </div>
      )}
    </main>
  );
}

export default App;