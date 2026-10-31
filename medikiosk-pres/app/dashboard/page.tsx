"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

const languages = {
  en: { langName: "English", heading: "What symptoms are you experiencing?", sub: "Select an organ dossier below or add a new health case to manage records.", add: "+ Add New Case", signIn: "Sign In", create: "Create Account", logout: "Logout", back: "Dashboard", ocr: "OCR Records", ocrDesc: "Scan prescriptions and lab reports", calendar: "Symptom Calendar", calendarDesc: "Timeline and journal notes", chat: "AI Chatbot", chatDesc: "Interactive AI helper", notes: "Doctor's Notes", notesDesc: "Clinical notes and history", reminders: "Reminders", remindersDesc: "Medicines and doctor visits", profile: "Profile", profileDesc: "Personal history", save: "Save Case", cancel: "Cancel", name: "Case / Organ Name", description: "Short Description / Symptoms" },
  hi: { langName: "हिंदी", heading: "आपको क्या समस्या महसूस हो रही है?", sub: "अपना स्वास्थ्य केस चुनें या नया केस जोड़ें।", add: "+ नया केस जोड़ें", signIn: "साइन इन करें", create: "खाता बनाएं", logout: "लॉगआउट", back: "डैशबोर्ड", ocr: "OCR रिकॉर्ड", ocrDesc: "पर्चे और लैब रिपोर्ट स्कैन करें", calendar: "लक्षण कैलेंडर", calendarDesc: "टाइमलाइन और नोट्स", chat: "AI चैटबॉट", chatDesc: "AI सहायक", notes: "डॉक्टर के नोट्स", notesDesc: "क्लिनिकल इतिहास", reminders: "रिमाइंडर", remindersDesc: "दवाइयां और डॉक्टर विजिट", profile: "प्रोफ़ाइल", profileDesc: "व्यक्तिगत इतिहास", save: "केस सहेजें", cancel: "रद्द करें", name: "केस / अंग का नाम", description: "लक्षणों का संक्षिप्त विवरण" },
  bn: { langName: "বাংলা", heading: "আপনার কী সমস্যা হচ্ছে?", sub: "একটি স্বাস্থ্য কেস নির্বাচন করুন বা নতুন কেস যোগ করুন।", add: "+ নতুন কেস যুক্ত করুন", signIn: "সাইন ইন করুন", create: "অ্যাকাউন্ট তৈরি করুন", logout: "লগআউট", back: "ড্যাশবোর্ড", ocr: "OCR রেকর্ড", ocrDesc: "প্রেসক্রিপশন ও রিপোর্ট স্ক্যান করুন", calendar: "লক্ষণ ক্যালেন্ডার", calendarDesc: "টাইমলাইন ও নোট", chat: "AI চ্যাটবট", chatDesc: "AI সহায়ক", notes: "ডাক্তারের নোট", notesDesc: "ক্লিনিক্যাল ইতিহাস", reminders: "রিমাইন্ডার", remindersDesc: "ওষুধ ও ডাক্তার ভিজিট", profile: "প্রোফাইল", profileDesc: "ব্যক্তিগত ইতিহাস", save: "কেস সংরক্ষণ", cancel: "বাতিল", name: "কেস / অঙ্গের নাম", description: "লক্ষণগুলোর সংক্ষিপ্ত বিবরণ" },
  ta: { langName: "தமிழ்", heading: "உங்களுக்கு என்ன அறிகுறிகள் உள்ளன?", sub: "ஒரு சுகாதார வழக்கைத் தேர்ந்தெடுக்கவும் அல்லது புதிய வழக்கைச் சேர்க்கவும்.", add: "+ புதிய வழக்கு", signIn: "உள்நுழையவும்", create: "கணக்கை உருவாக்கவும்", logout: "வெளியேறு", back: "டாஷ்போர்டு", ocr: "OCR பதிவுகள்", ocrDesc: "மருந்துச் சீட்டு மற்றும் அறிக்கைகளை ஸ்கேன் செய்யவும்", calendar: "அறிகுறி நாள்காட்டி", calendarDesc: "காலவரிசை மற்றும் குறிப்புகள்", chat: "AI அரட்டை", chatDesc: "AI உதவியாளர்", notes: "மருத்துவர் குறிப்புகள்", notesDesc: "மருத்துவ வரலாறு", reminders: "நினைவூட்டல்கள்", remindersDesc: "மருந்துகள் மற்றும் சந்திப்புகள்", profile: "சுயவிவரம்", profileDesc: "தனிப்பட்ட வரலாறு", save: "வழக்கைச் சேமிக்கவும்", cancel: "ரத்து", name: "வழக்கு / உறுப்பு பெயர்", description: "அறிகுறிகளின் சுருக்கம்" },
} as const;
type Language = keyof typeof languages;
type UiText = (typeof languages)[Language];
const fixedCopy: Record<Language, Record<string, string>> = {
  en: { tagline: "Your health journey, all in one place.", back: "Back", patientDashboard: "PATIENT DASHBOARD", patient: "Patient:", open: "Open dashboard", edit: "Edit", delete: "Delete", otherCases: "Other health cases", logSymptoms: "Log today's symptoms", chooseOrgan: "Choose a common organ", addCase: "Add Health Case", editCase: "Edit Health Case", icon: "Icon", fullName: "Full name", username: "Username", password: "Password", confirmPassword: "Confirm password", age: "Age", gender: "Gender", continueAbha: "Continue with ABHA", gotIt: "Got it", invalidLogin: "Invalid username or password", passwordMismatch: "Passwords do not match", ready: "Ready to connect to the corresponding MediKiosk service.", listen: "Listen", stop: "Stop", or: "OR" },
  hi: { tagline: "आपकी स्वास्थ्य यात्रा, एक ही स्थान पर।", back: "वापस", patientDashboard: "रोगी डैशबोर्ड", patient: "रोगी:", open: "डैशबोर्ड खोलें", edit: "संपादित करें", delete: "हटाएं", otherCases: "अन्य स्वास्थ्य केस", logSymptoms: "आज के लक्षण दर्ज करें", chooseOrgan: "सामान्य अंग चुनें", addCase: "स्वास्थ्य केस जोड़ें", editCase: "स्वास्थ्य केस संपादित करें", icon: "आइकन", fullName: "पूरा नाम", username: "उपयोगकर्ता नाम", password: "पासवर्ड", confirmPassword: "पासवर्ड की पुष्टि करें", age: "उम्र", gender: "लिंग", continueAbha: "ABHA के साथ जारी रखें", gotIt: "समझ गया", invalidLogin: "उपयोगकर्ता नाम या पासवर्ड गलत है", passwordMismatch: "पासवर्ड मेल नहीं खाते", ready: "MediKiosk सेवा से जुड़ने के लिए तैयार।", listen: "सुनें", stop: "रोकें", or: "या" },
  bn: { tagline: "আপনার স্বাস্থ্য যাত্রা, এক জায়গায়।", back: "ফিরে যান", patientDashboard: "রোগী ড্যাশবোর্ড", patient: "রোগী:", open: "ড্যাশবোর্ড খুলুন", edit: "সম্পাদনা", delete: "মুছুন", otherCases: "অন্যান্য স্বাস্থ্য কেস", logSymptoms: "আজকের লক্ষণ রেকর্ড করুন", chooseOrgan: "সাধারণ অঙ্গ নির্বাচন করুন", addCase: "স্বাস্থ্য কেস যোগ করুন", editCase: "স্বাস্থ্য কেস সম্পাদনা করুন", icon: "আইকন", fullName: "সম্পূর্ণ নাম", username: "ইউজারনেম", password: "পাসওয়ার্ড", confirmPassword: "পাসওয়ার্ড নিশ্চিত করুন", age: "বয়স", gender: "লিঙ্গ", continueAbha: "ABHA দিয়ে এগিয়ে যান", gotIt: "বুঝেছি", invalidLogin: "ইউজারনেম বা পাসওয়ার্ড ভুল", passwordMismatch: "পাসওয়ার্ড মিলছে না", ready: "MediKiosk পরিষেবার সঙ্গে সংযোগের জন্য প্রস্তুত।", listen: "শুনুন", stop: "থামুন", or: "অথবা" },
  ta: { tagline: "உங்கள் நல்வாழ்வுப் பயணம், ஒரே இடத்தில்.", back: "திரும்பு", patientDashboard: "நோயாளர் டாஷ்போர்டு", patient: "நோயாளர்:", open: "டாஷ்போர்டைத் திற", edit: "திருத்து", delete: "நீக்கு", otherCases: "பிற சுகாதார வழக்குகள்", logSymptoms: "இன்றைய அறிகுறிகளைப் பதிவு செய்", chooseOrgan: "பொதுவான உறுப்பைத் தேர்ந்தெடுக்கவும்", addCase: "சுகாதார வழக்கைச் சேர்க்கவும்", editCase: "சுகாதார வழக்கைத் திருத்தவும்", icon: "ஐகான்", fullName: "முழு பெயர்", username: "பயனர்பெயர்", password: "கடவுச்சொல்", confirmPassword: "கடவுச்சொல்லை உறுதிப்படுத்தவும்", age: "வயது", gender: "பாலினம்", continueAbha: "ABHA மூலம் தொடரவும்", gotIt: "புரிந்தது", invalidLogin: "பயனர்பெயர் அல்லது கடவுச்சொல் தவறானது", passwordMismatch: "கடவுச்சொற்கள் பொருந்தவில்லை", ready: "MediKiosk சேவையுடன் இணைக்கத் தயாராக உள்ளது.", listen: "கேளுங்கள்", stop: "நிறுத்து", or: "அல்லது" },
};
function fixed(language: Language, key: string) { return fixedCopy[language][key] ?? fixedCopy.en[key] ?? key; }
type CaseItem = { id: string; name: string; description: string; icon: string };
type User = { fullName: string; username: string; password: string; age?: string; gender?: string; cases: CaseItem[] };
type AuthResponse = { access_token: string; user_id: number; username: string; full_name?: string; detail?: string };

async function authenticate(action: "login" | "register", payload: Record<string, string>): Promise<AuthResponse> {
  const response = await fetch(`/api/auth/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const data = (await response.json()) as AuthResponse;
  if (!response.ok) throw new Error(data.detail || "Authentication failed.");
  window.localStorage.setItem("medikiosk_access_token", data.access_token);
  window.localStorage.setItem("medikiosk_user_id", String(data.user_id));
  return data;
}

const defaultCases: CaseItem[] = [
  { id: "eyes", name: "Eyes", description: "Vision, pain, redness", icon: "👁️" },
  { id: "stomach", name: "Stomach", description: "Digestive pain and cramps", icon: "🫃" },
  { id: "head", name: "Head", description: "Headache and dizziness", icon: "🧠" },
];
const featureIcons = ["📄", "📅", "💬", "🩺", "⏰", "👤"];
const organCopy: Record<Language, Record<string, { name: string; description: string }>> = {
  en: {
    eyes: { name: "Eyes", description: "Vision, pain, redness" }, stomach: { name: "Stomach", description: "Digestive pain and cramps" }, head: { name: "Head", description: "Headache and dizziness" }, leg: { name: "Leg", description: "Joint pain, sprain, swelling" }, hand: { name: "Hand / Arm", description: "Numbness and wrist pain" }, heart: { name: "Heart / Chest", description: "Chest discomfort and palpitations" }, skin: { name: "Skin", description: "Rash, itching, allergy" }, teeth: { name: "Teeth / Dental", description: "Toothache and sensitivity" },
  },
  hi: {
    eyes: { name: "आँखें", description: "दृष्टि, दर्द, लालिमा" }, stomach: { name: "पेट", description: "पाचन, दर्द और मरोड़" }, head: { name: "सिर", description: "सिरदर्द और चक्कर" }, leg: { name: "टाँग", description: "जोड़ों का दर्द, मोच, सूजन" }, hand: { name: "हाथ / बांह", description: "सुन्नपन और कलाई का दर्द" }, heart: { name: "दिल / छाती", description: "छाती में परेशानी और धड़कन" }, skin: { name: "त्वचा", description: "चकत्ते, खुजली, एलर्जी" }, teeth: { name: "दाँत / डेंटल", description: "दाँत दर्द और संवेदनशीलता" },
  },
  bn: {
    eyes: { name: "চোখ", description: "দৃষ্টির সমস্যা, ব্যথা, লালভাব" }, stomach: { name: "পেট", description: "হজম, ব্যথা ও মুচড়ানো" }, head: { name: "মাথা", description: "মাথাব্যথা ও মাথা ঘোরা" }, leg: { name: "পা", description: "জয়েন্টে ব্যথা, মচকানো, ফোলা" }, hand: { name: "হাত / বাহু", description: "অবশভাব ও কবজির ব্যথা" }, heart: { name: "হৃদয় / বুক", description: "বুকে অস্বস্তি ও ধড়ফড়" }, skin: { name: "ত্বক", description: "র‍্যাশ, চুলকানি, অ্যালার্জি" }, teeth: { name: "দাঁত / ডেন্টাল", description: "দাঁতের ব্যথা ও সংবেদনশীলতা" },
  },
  ta: {
    eyes: { name: "கண்கள்", description: "பார்வை, வலி, சிவத்தல்" }, stomach: { name: "வயிறு", description: "செரிமானம், வலி, பிடிப்பு" }, head: { name: "தலை", description: "தலைவலி மற்றும் தலைச்சுற்றல்" }, leg: { name: "கால்", description: "மூட்டு வலி, சுளுக்கு, வீக்கம்" }, hand: { name: "கை / புயம்", description: "மரத்தல் மற்றும் மணிக்கட்டு வலி" }, heart: { name: "இதயம் / நெஞ்சு", description: "நெஞ்சு அசௌகரியம் மற்றும் படபடப்பு" }, skin: { name: "தோல்", description: "தடிப்பு, அரிப்பு, ஒவ்வாமை" }, teeth: { name: "பல் / பல் மருத்துவம்", description: "பல்வலி மற்றும் உணர்திறன்" },
  },
};

function localizeCase(item: CaseItem, language: Language): CaseItem {
  const normalized = `${item.id} ${item.name}`.toLowerCase();
  const key = normalized.includes("eye") || normalized.includes("ஆண்") || normalized.includes("চোখ") || normalized.includes("கண்") ? "eyes" : normalized.includes("stomach") || normalized.includes("पेट") || normalized.includes("পেট") || normalized.includes("வயிறு") ? "stomach" : normalized.includes("head") || normalized.includes("सिर") || normalized.includes("মাথা") || normalized.includes("தலை") ? "head" : normalized.includes("leg") || normalized.includes("टाँग") || normalized.includes("পা") || normalized.includes("கால்") ? "leg" : normalized.includes("hand") || normalized.includes("arm") || normalized.includes("हाथ") || normalized.includes("হাত") || normalized.includes("கை") ? "hand" : normalized.includes("heart") || normalized.includes("chest") || normalized.includes("दिल") || normalized.includes("হৃদয়") || normalized.includes("இதயம்") ? "heart" : normalized.includes("skin") || normalized.includes("त्वचा") || normalized.includes("ত্বক") || normalized.includes("தோல்") ? "skin" : normalized.includes("teeth") || normalized.includes("dental") || normalized.includes("दाँत") || normalized.includes("দাঁত") || normalized.includes("பல்") ? "teeth" : "";
  const translation = key ? organCopy[language][key] : undefined;
  return translation ? { ...item, ...translation } : item;
}

export default function DashboardPage() {
  const [language, setLanguage] = useState<Language>("en");
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<"welcome" | "signin" | "create" | "cases" | "case">("welcome");
  const [activeCase, setActiveCase] = useState<CaseItem | null>(null);
  const [modal, setModal] = useState<"none" | "abha" | "feature" | "case">("none");
  const [feature, setFeature] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const t = languages[language];

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("medikiosk_language") as Language | null;
    if (savedLanguage && savedLanguage in languages) setLanguage(savedLanguage);
    const savedSession = window.localStorage.getItem("medikiosk_dashboard_session");
    const savedUsers = window.localStorage.getItem("medikiosk_dashboard_users");
    const accessToken = window.localStorage.getItem("medikiosk_access_token");
    if (accessToken && savedSession && savedUsers) {
      const users = JSON.parse(savedUsers) as Record<string, User>;
      const session = JSON.parse(savedSession) as { username: string };
      if (users[session.username]) {
        setUser(users[session.username]);
        setView("cases");
      }
    }
    setHydrated(true);
  }, []);

  function saveUser(nextUser: User) {
    const users = JSON.parse(window.localStorage.getItem("medikiosk_dashboard_users") || "{}") as Record<string, User>;
    users[nextUser.username] = nextUser;
    window.localStorage.setItem("medikiosk_dashboard_users", JSON.stringify(users));
    setUser(nextUser);
  }

  function signOut() {
    window.localStorage.removeItem("medikiosk_dashboard_session");
    window.localStorage.removeItem("medikiosk_access_token");
    window.localStorage.removeItem("medikiosk_user_id");
    setUser(null);
    setActiveCase(null);
    setView("welcome");
  }

  function speakPage() {
    if (!("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const text = view === "cases" ? `${t.heading}. ${t.sub}. ${user?.cases.map((item) => item.name).join(", ")}` : "MediKiosk. Your health journey, all in one place.";
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "en" ? "en-IN" : `${language}-IN`;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  function openFeature(title: string, icon: string) {
    if (title === t.chat) {
      window.location.assign("/chatbot");
      return;
    }
    setFeature(`${icon} ${title}`);
    setModal("feature");
  }

  if (!hydrated) {
    return <main className="dashboard-shell dashboard-loading" aria-busy="true" />;
  }

  return (
    <main className="dashboard-shell">
      <header className="dashboard-topbar">
        <button className="dashboard-brand" onClick={() => setView(user ? "cases" : "welcome")} aria-label="MediKiosk home"><span>+</span><strong>MediKiosk</strong></button>
        <div className="dashboard-actions">
          <button className="dashboard-listen" onClick={speakPage}>{speaking ? fixed(language, "stop") : fixed(language, "listen")}</button>
          <select value={language} onChange={(event) => { const nextLanguage = event.target.value as Language; setLanguage(nextLanguage); window.localStorage.setItem("medikiosk_language", nextLanguage); }} aria-label="Language"><option value="en">English</option><option value="hi">हिंदी</option><option value="bn">বাংলা</option><option value="ta">தமிழ்</option></select>
          {user ? <button className="dashboard-logout" onClick={signOut}>{t.logout}</button> : null}
        </div>
      </header>

      <section className="dashboard-content">
        {view === "welcome" && <Welcome language={language} t={t} onCreate={() => setView("create")} onSignIn={() => setView("signin")} onAbha={() => setModal("abha")} />}
        {view === "signin" && <AuthForm language={language} title={t.signIn} submitLabel={t.signIn} onSubmit={async (event) => { event.preventDefault(); try { const form = new FormData(event.currentTarget); const result = await authenticate("login", { username: String(form.get("username")).trim(), password: String(form.get("password")) }); const existing = JSON.parse(window.localStorage.getItem("medikiosk_dashboard_users") || "{}") as Record<string, User>; const candidate = existing[result.username] || { fullName: result.full_name || result.username, username: result.username, password: "", cases: [...defaultCases] }; saveUser(candidate); window.localStorage.setItem("medikiosk_dashboard_session", JSON.stringify({ username: result.username })); setUser(candidate); setView("cases"); setMessage(""); } catch (error) { setMessage(error instanceof Error ? error.message : fixed(language, "invalidLogin")); } }} onBack={() => setView("welcome")} message={message} />}
        {view === "create" && <AuthForm language={language} title={t.create} submitLabel={t.create} includeFullName onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const password = String(form.get("password")); if (password !== String(form.get("confirmPassword"))) { setMessage(fixed(language, "passwordMismatch")); return; } try { const result = await authenticate("register", { username: String(form.get("username")).trim(), password, full_name: String(form.get("fullName")) }); const nextUser = { fullName: result.full_name || String(form.get("fullName")), username: result.username, password: "", age: String(form.get("age")), gender: String(form.get("gender")), cases: [...defaultCases] }; saveUser(nextUser); window.localStorage.setItem("medikiosk_dashboard_session", JSON.stringify({ username: result.username })); setView("cases"); setMessage(""); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not create account"); } }} onBack={() => setView("welcome")} message={message} />}
        {view === "cases" && user && <CasesView language={language} user={user} t={t} onAdd={() => { setEditingId(null); setModal("case"); }} onOpen={(item) => { setActiveCase(item); setView("case"); }} onEdit={(item) => { setActiveCase(item); setEditingId(item.id); setModal("case"); }} onDelete={(id) => { const next = { ...user, cases: user.cases.filter((item) => item.id !== id) }; saveUser(next); }} />}
        {view === "case" && user && activeCase && <CaseView language={language} item={activeCase} t={t} onBack={() => setView("cases")} onOcr={() => window.location.assign("/ocr-record")} onFeature={openFeature} />}
      </section>

      {modal === "case" && <CaseModal language={language} t={t} item={editingId ? user?.cases.find((item) => item.id === editingId) : undefined} onClose={() => setModal("none")} onSave={(item) => { if (!user) return; const cases = editingId ? user.cases.map((existing) => existing.id === editingId ? { ...item, id: editingId } : existing) : [...user.cases, { ...item, id: `case_${Date.now()}` }]; saveUser({ ...user, cases }); setModal("none"); }} />}
      {modal === "abha" && <Overlay language={language} title="ABHA Integration Coming Soon" text="ABHA-based authentication is planned for a future version of MediKiosk." onClose={() => setModal("none")} />}
      {modal === "feature" && <Overlay language={language} title={feature} text={fixed(language, "ready")} onClose={() => setModal("none")} />}
    </main>
  );
}

function Welcome({ language, t, onCreate, onSignIn, onAbha }: { language: Language; t: UiText; onCreate: () => void; onSignIn: () => void; onAbha: () => void }) {
  return <div className="dashboard-panel dashboard-welcome"><div className="dashboard-mark">+</div><h1>MediKiosk</h1><p>{fixed(language, "tagline")}</p><button className="dashboard-primary" onClick={onCreate}>{t.create}</button><div className="dashboard-or">{fixed(language, "or")}</div><button className="dashboard-secondary" onClick={onSignIn}>{t.signIn}</button><button className="dashboard-link" onClick={onAbha}>{fixed(language, "continueAbha")}</button></div>;
}

function AuthForm({ language, title, submitLabel, includeFullName = false, onSubmit, onBack, message }: { language: Language; title: string; submitLabel: string; includeFullName?: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onBack: () => void; message: string }) {
  return <div className="dashboard-panel dashboard-form"><button className="dashboard-back" onClick={onBack}>{fixed(language, "back")}</button><h2>{title}</h2><form onSubmit={onSubmit}>{includeFullName && <><input name="fullName" placeholder={fixed(language, "fullName")} required /><div className="dashboard-form-row"><input name="age" type="number" min="1" max="120" placeholder={fixed(language, "age")} required /><select name="gender" defaultValue="" required><option value="" disabled>{fixed(language, "gender")}</option><option>Female</option><option>Male</option><option>Other</option><option>Prefer not to say</option></select></div></>}{<input name="username" placeholder={fixed(language, "username")} required />}{<input name="password" placeholder={fixed(language, "password")} type="password" required minLength={6} />}{includeFullName && <input name="confirmPassword" placeholder={fixed(language, "confirmPassword")} type="password" required minLength={6} />}<button className="dashboard-primary" type="submit">{submitLabel}</button></form>{message && <p className="dashboard-error">{message}</p>}</div>;
}

function CasesView({ language, user, t, onAdd, onOpen, onEdit, onDelete }: { language: Language; user: User; t: UiText; onAdd: () => void; onOpen: (item: CaseItem) => void; onEdit: (item: CaseItem) => void; onDelete: (id: string) => void }) {
  return <div className="dashboard-cases"><div className="dashboard-heading"><div><span className="dashboard-eyebrow">{fixed(language, "patientDashboard")}</span><h1>{t.heading}</h1><p>{t.sub}</p></div><span className="dashboard-patient">{fixed(language, "patient")} <strong>{user.fullName}</strong></span></div><div className="case-grid">{user.cases.map((item) => { const localized = localizeCase(item, language); return <article className="case-card" key={item.id} onClick={() => onOpen(item)}><div className="case-actions"><button onClick={(event) => { event.stopPropagation(); onEdit(item); }} aria-label={`${fixed(language, "edit")} ${localized.name}`}>{fixed(language, "edit")}</button><button onClick={(event) => { event.stopPropagation(); onDelete(item.id); }} aria-label={`${fixed(language, "delete")} ${localized.name}`}>{fixed(language, "delete")}</button></div><span className="case-icon">{localized.icon}</span><h2>{localized.name}</h2><p>{localized.description}</p><span className="case-open">{fixed(language, "open")}</span></article>; })}<button className="case-add" onClick={onAdd}><span>+</span>{t.add}</button></div></div>;
}

function CaseView({ language, item, t, onBack, onOcr, onFeature }: { language: Language; item: CaseItem; t: UiText; onBack: () => void; onOcr: () => void; onFeature: (title: string, icon: string) => void }) {
  const features = [[t.ocr, t.ocrDesc, featureIcons[0]], [t.calendar, t.calendarDesc, featureIcons[1]], [t.chat, t.chatDesc, featureIcons[2]], [t.notes, t.notesDesc, featureIcons[3]], [t.reminders, t.remindersDesc, featureIcons[4]], [t.profile, t.profileDesc, featureIcons[5]]];
  const localized = localizeCase(item, language);
  return <div className="case-workspace"><button className="dashboard-back" onClick={onBack}>{fixed(language, "otherCases")}</button><section className="case-hero"><span className="case-icon">{localized.icon}</span><h1>{localized.name}</h1><p>{localized.description}</p><button className="dashboard-primary" onClick={() => onFeature(t.calendar, featureIcons[1])}>{fixed(language, "logSymptoms")}</button></section><div className="feature-grid">{features.map(([title, description, icon], index) => <button key={title} className="feature-card" onClick={index === 0 ? onOcr : () => onFeature(title, icon)}><span>{icon}</span><strong>{title}</strong><small>{description}</small></button>)}</div></div>;
}

function CaseModal({ language, t, item, onClose, onSave }: { language: Language; t: UiText; item?: CaseItem; onClose: () => void; onSave: (item: Omit<CaseItem, "id">) => void }) {
  const presets = [{ value: "Eyes", icon: "👁️", description: "Vision, pain, redness" }, { value: "Stomach", icon: "🫃", description: "Digestive pain and cramps" }, { value: "Head", icon: "🧠", description: "Headache and dizziness" }, { value: "Leg", icon: "🦵", description: "Joint pain, sprain, swelling" }, { value: "Hand / Arm", icon: "✋", description: "Numbness and wrist pain" }, { value: "Heart / Chest", icon: "🫀", description: "Chest discomfort and palpitations" }, { value: "Skin", icon: "🧴", description: "Rash, itching, allergy" }, { value: "Teeth / Dental", icon: "🦷", description: "Toothache and sensitivity" }];
  const [form, setForm] = useState({ name: item?.name || "", description: item?.description || "", icon: item?.icon || "🩺" });
  function selectPreset(value: string) { const preset = presets.find((entry) => entry.value === value); if (preset) setForm({ name: preset.value, icon: preset.icon, description: preset.description }); }
  return <div className="dashboard-overlay"><form className="dashboard-modal" onSubmit={(event) => { event.preventDefault(); onSave(form); }}><button type="button" className="modal-close" onClick={onClose}>×</button><h2>{item ? fixed(language, "editCase") : fixed(language, "addCase")}</h2><select value={presets.some((preset) => preset.value === form.name) ? form.name : ""} onChange={(event) => selectPreset(event.target.value)}><option value="">{fixed(language, "chooseOrgan")}</option>{presets.map((preset) => <option key={preset.value}>{preset.value}</option>)}</select><input value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} maxLength={2} aria-label={fixed(language, "icon")} /><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder={t.name} required /><input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder={t.description} required /><div className="modal-actions"><button type="button" onClick={onClose}>{t.cancel}</button><button className="dashboard-primary" type="submit">{t.save}</button></div></form></div>;
}

function Overlay({ language, title, text, onClose }: { language: Language; title: string; text: string; onClose: () => void }) {
  return <div className="dashboard-overlay"><div className="dashboard-modal"><button className="modal-close" onClick={onClose}>×</button><div className="dashboard-mark">+</div><h2>{title}</h2><p>{text}</p><button className="dashboard-primary" onClick={onClose}>{fixed(language, "gotIt")}</button></div></div>;
}
