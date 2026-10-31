"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Role = "assistant" | "user";
type Message = { id: string; role: Role; content: string; timestamp: string };
type Language = "en" | "hi";

type History = {
  concern: string;
  timeline: string;
  severity: string;
  other: string;
  medications: string;
  allergies: string;
  medical: string;
  triggers: string;
};

const welcome: Record<Language, string> = {
  en: "Hello, I'm MediKiosk's patient assistant. I'll ask a few questions about how you're feeling so we can prepare a brief history for your doctor. What symptoms are you facing currently?",
  hi: "नमस्ते, मैं मेडिकिओस्क का रोगी सहायक हूँ। मैं आपके स्वास्थ्य के बारे में कुछ प्रश्न पूछूँगा ताकि आपके डॉक्टर के लिए संक्षिप्त विवरण तैयार कर सकें। आपको अभी क्या लक्षण महसूस हो रहे हैं?",
};

const labels = {
  en: { title: "Let's understand how you're feeling.", sub: "Take your time. There is no right or wrong way to answer.", send: "Send", restart: "Restart", clear: "Clear", history: "Visit history", dashboard: "Dashboard", help: "Help", placeholder: "Type your answer here...", saved: "responses saved", empty: "Not shared yet", urgent: "If you have severe chest pain, trouble breathing, signs of a stroke, or uncontrolled bleeding, call your local emergency number now.", visit: "YOUR VISIT", progress: "History in progress", start: "Getting started", pace: "Answer at your own pace.", expect: "WHAT TO EXPECT", share: "Share what brought you in", questions: "Answer simple questions", review: "Review with your doctor", privacy: "Your answers are private and used to prepare for your visit.", step: "PRE-VISIT CHECK-IN · STEP 01", ready: "Ready when you are", thinking: "MediKiosk is thinking...", listen: "Listen", stop: "Stop", open: "Open history →", needHelp: "Need immediate help?", summary: "A structured summary of what you shared during this conversation.", backConversation: "Back to conversation", disclaimer: "This assistant collects information for your doctor. It does not diagnose conditions or replace medical advice." },
  hi: { title: "आइए समझें कि आप कैसा महसूस कर रहे हैं।", sub: "अपना समय लें। उत्तर देने का कोई गलत तरीका नहीं है।", send: "भेजें", restart: "पुनः आरंभ", clear: "साफ़ करें", history: "विज़िट इतिहास", dashboard: "डैशबोर्ड", help: "सहायता", placeholder: "यहाँ अपना उत्तर टाइप करें...", saved: "प्रतिक्रियाएं सहेजी गईं", empty: "अभी साझा नहीं किया गया", urgent: "यदि आपको सीने में गंभीर दर्द, सांस लेने में तकलीफ, स्ट्रोक के संकेत या अत्यधिक रक्तस्राव हो, तो तुरंत स्थानीय आपातकालीन नंबर पर कॉल करें।", visit: "आपकी यात्रा", progress: "इतिहास प्रगति पर है", start: "शुरू हो रहा है", pace: "अपनी गति से उत्तर दें।", expect: "क्या अपेक्षा करें", share: "बताएं कि आप किस समस्या के लिए आए हैं", questions: "सरल प्रश्नों के उत्तर दें", review: "अपने डॉक्टर के साथ समीक्षा करें", privacy: "आपके उत्तर गोपनीय हैं और आपकी यात्रा की तैयारी के लिए उपयोग किए जाते हैं।", step: "विज़िट-पूर्व चेक-इन · चरण 01", ready: "आपकी सहायता के लिए तैयार", thinking: "मेडिकिओस्क सोच रहा है...", listen: "सुनें", stop: "रोकें", open: "इतिहास खोलें →", needHelp: "तत्काल सहायता चाहिए?", summary: "इस बातचीत में आपके द्वारा साझा की गई जानकारी का संरचित सारांश।", backConversation: "बातचीत पर वापस जाएं", disclaimer: "यह सहायक आपके डॉक्टर के लिए जानकारी एकत्र करता है। यह बीमारियों का निदान नहीं करता है।" },
};

const emptyHistory = (): History => ({ concern: "", timeline: "", severity: "", other: "", medications: "", allergies: "", medical: "", triggers: "" });
const message = (role: Role, content: string): Message => ({ id: `${Date.now()}-${Math.random()}`, role, content, timestamp: new Date().toISOString() });

function buildHistory(messages: Message[]): History {
  const answers = messages.filter((item) => item.role === "user").map((item) => item.content.trim());
  return { ...emptyHistory(), concern: answers[0] ?? "", timeline: answers[1] ?? "", severity: answers[2] ?? "", other: answers[3] ?? "", medications: answers[4] ?? "", allergies: answers[5] ?? "", medical: answers[6] ?? "", triggers: answers[7] ?? "" };
}

export default function ChatbotPage() {
  const [language, setLanguage] = useState<Language>("en");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const t = labels[language];
  const storageKey = typeof window === "undefined" ? "medikiosk-chat" : `medikiosk-chat-${window.localStorage.getItem("medikiosk_user_id") ?? "guest"}`;
  const history = useMemo(() => buildHistory(messages), [messages]);

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("medikiosk_language") as Language | null;
    if (savedLanguage === "en" || savedLanguage === "hi") setLanguage(savedLanguage);
    try {
      const saved = window.localStorage.getItem(storageKey);
      setMessages(saved ? JSON.parse(saved) as Message[] : [message("assistant", welcome.en)]);
    } catch {
      setMessages([message("assistant", welcome.en)]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (messages.length) window.localStorage.setItem(storageKey, JSON.stringify(messages));
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, storageKey]);

  function restart() {
    setMessages([message("assistant", welcome[language])]);
    setDraft("");
    setError("");
  }

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const content = draft.trim();
    if (!content || loading) return;
    const next = [...messages, message("user", content)];
    setMessages(next);
    setDraft("");
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/chatbot", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${window.localStorage.getItem("medikiosk_access_token") ?? ""}` }, body: JSON.stringify({ messages: next.map(({ role, content: text }) => ({ role, content: text })) }) });
      const data = await response.json() as { message?: { content?: string }; error?: string };
      if (!response.ok || !data.message?.content) throw new Error(data.error || "The assistant could not respond.");
      setMessages((current) => [...current, message("assistant", data.message?.content ?? "")]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The assistant could not respond. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "hi" ? "hi-IN" : "en-IN";
    utterance.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  const historyRows: Array<[string, string]> = language === "hi" ? [["मुख्य चिंता", history.concern], ["यह कब शुरू हुआ", history.timeline], ["गंभीरता और स्थान", history.severity], ["अन्य लक्षण", history.other], ["दवाइयां", history.medications], ["एलर्जी", history.allergies], ["चिकित्सा इतिहास", history.medical], ["क्या मदद करता है", history.triggers]] : [["Main concern", history.concern], ["When it started", history.timeline], ["Severity and location", history.severity], ["Other symptoms", history.other], ["Medications and supplements", history.medications], ["Allergies", history.allergies], ["Medical history", history.medical], ["What helps or worsens it", history.triggers]];

  return <main className="chatbot-shell">
    <header className="chatbot-topbar"><Link href="/" className="chatbot-brand"><span>+</span><strong>MEDIKIOSK</strong><small>AI-Powered Clinical History</small></Link><div className="chatbot-actions"><Link href="/" className="chatbot-action">← {t.dashboard}</Link><button className="chatbot-action" onClick={() => { const nextLanguage = language === "en" ? "hi" : "en"; setLanguage(nextLanguage); window.localStorage.setItem("medikiosk_language", nextLanguage); }}>{language === "en" ? "हिंदी" : "English"}</button><button className="chatbot-action" onClick={() => setShowHistory(true)}>{t.history}</button></div></header>
    <div className="chatbot-layout"><aside className="chatbot-rail"><p className="chatbot-kicker">{t.visit}</p><div className="chatbot-progress"><span style={{ height: `${Math.min(88, 26 + messages.filter((item) => item.role === "user").length * 9)}%` }} /></div><p className="chatbot-rail-title">{messages.filter((item) => item.role === "user").length ? t.progress : t.start}</p><p className="chatbot-muted">{t.pace}</p><hr /><p className="chatbot-kicker">{t.expect}</p><ul><li>{t.share}</li><li>{t.questions}</li><li>{t.review}</li></ul><p className="chatbot-privacy">{t.privacy}</p></aside>
      <section className="chatbot-main"><div className="chatbot-heading"><div><p className="chatbot-eyebrow">{t.step}</p><h1>{t.title}</h1><p>{t.sub}</p></div><div className="chatbot-heading-actions"><button onClick={restart}>{t.restart}</button><button onClick={() => { if (window.confirm("Clear this conversation and start over?")) restart(); }}>{t.clear}</button></div></div><div className="chatbot-card"><div className="chatbot-card-head"><strong>✦ MediKiosk Assistant</strong><span>● {t.ready}</span></div><div className="chatbot-messages" ref={messagesRef}>{messages.map((item) => <div className={`chatbot-message ${item.role}`} key={item.id}><div className="chatbot-bubble">{item.content}</div><div className="chatbot-meta"><time>{new Date(item.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time>{item.role === "assistant" && <button onClick={() => speak(item.content)}>{speaking ? t.stop : t.listen}</button>}</div></div>)}{loading && <div className="chatbot-typing">{t.thinking}</div>}</div>{error && <div className="chatbot-error">{error}</div>}<form className="chatbot-composer" onSubmit={send}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={t.placeholder} rows={2} disabled={loading} /><button type="submit" disabled={!draft.trim() || loading}>{t.send} ↑</button></form></div><p className="chatbot-disclaimer">{t.disclaimer}</p></section>
      <aside className="chatbot-side"><button onClick={() => setShowHistory(true)}><strong>{t.history}</strong><span>{messages.filter((item) => item.role === "user").length} {t.saved}</span><b>{t.open}</b></button><p><strong>{t.needHelp}</strong><br />{t.urgent}</p></aside></div>
    {showHistory && <div className="chatbot-overlay" onClick={() => setShowHistory(false)}><section className="chatbot-history" onClick={(event) => event.stopPropagation()}><button className="chatbot-close" onClick={() => setShowHistory(false)}>×</button><h2>{t.history}</h2><p>{t.summary}</p><div className="chatbot-history-grid">{historyRows.map(([label, value]) => <div key={label}><strong>{label}</strong><p>{value || t.empty}</p></div>)}</div><button className="chatbot-primary" onClick={() => setShowHistory(false)}>{t.backConversation}</button></section></div>}
  </main>;
}
