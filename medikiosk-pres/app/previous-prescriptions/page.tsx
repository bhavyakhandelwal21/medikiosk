"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const LANGUAGE_OPTIONS = {
  en: "English",
  hi: "Hindi",
  ta: "Tamil",
  bn: "Bengali",
} as const;

type LanguageCode = keyof typeof LANGUAGE_OPTIONS;

const TEXT = {
  en: {
    title: "Previous Prescriptions",
    back: "Back",
    backDashboard: "Back to Dashboard",
    open: "Open File",
    delete: "Delete Prescription",
    loading: "Loading...",
    none: "No prescriptions uploaded yet.", records: "YOUR RECORDS", saved: "Saved files", actions: "RECORD ACTIONS", openAction: "Open a prescription", deleteAction: "Delete a record", returnAction: "Return to scanner", eyebrow: "PATIENT RECORDS · DOCUMENT LIBRARY", intro: "Review the prescriptions previously added to your clinical history.", history: "Prescription history", stored: "Stored documents", privacy: "YOUR PRIVACY", privacyText: "Documents are kept in your local clinical record until you delete them.", uploaded: "Uploaded:",
  },
  hi: {
    title: "पिछली प्रिस्क्रिप्शन",
    back: "वापस",
    backDashboard: "डैशबोर्ड पर वापस",
    open: "फाइल खोलें",
    delete: "प्रिस्क्रिप्शन हटाएं",
    loading: "लोड हो रहा है...",
    none: "अभी तक कोई प्रिस्क्रिप्शन अपलोड नहीं हुआ है।", records: "आपके रिकॉर्ड", saved: "सहेजी गई फाइलें", actions: "रिकॉर्ड कार्य", openAction: "प्रिस्क्रिप्शन खोलें", deleteAction: "रिकॉर्ड हटाएं", returnAction: "स्कैनर पर वापस जाएं", eyebrow: "रोगी रिकॉर्ड · दस्तावेज़ लाइब्रेरी", intro: "अपने क्लिनिकल इतिहास में जोड़े गए प्रिस्क्रिप्शन देखें।", history: "प्रिस्क्रिप्शन इतिहास", stored: "संग्रहीत दस्तावेज़", privacy: "आपकी गोपनीयता", privacyText: "दस्तावेज़ आपके स्थानीय क्लिनिकल रिकॉर्ड में तब तक रखे जाते हैं जब तक आप उन्हें हटाते नहीं।", uploaded: "अपलोड किया गया:",
  },
  ta: {
    title: "முந்தைய மருந்து பட்டியல்கள்",
    back: "திரும்பு",
    backDashboard: "டாஷ்போர்டுக்கு திரும்பு",
    open: "கோப்பைத் திற",
    delete: "மருந்து பட்டியலை நீக்கு",
    loading: "ஏற்றுகிறது...",
    none: "இதுவரை எந்த மருந்து பட்டியலும் பதிவேற்றப்படவில்லை.", records: "உங்கள் பதிவுகள்", saved: "சேமித்த கோப்புகள்", actions: "பதிவு செயல்கள்", openAction: "மருந்து பட்டியலைத் திற", deleteAction: "பதிவை நீக்கு", returnAction: "ஸ்கேனருக்குத் திரும்பு", eyebrow: "நோயாளர் பதிவுகள் · ஆவண நூலகம்", intro: "உங்கள் மருத்துவ வரலாற்றில் சேர்க்கப்பட்ட மருந்து பட்டியல்களைப் பார்க்கவும்.", history: "மருந்து பட்டியல் வரலாறு", stored: "சேமித்த ஆவணங்கள்", privacy: "உங்கள் தனியுரிமை", privacyText: "நீங்கள் நீக்கும் வரை ஆவணங்கள் உங்கள் உள்ளூர் மருத்துவ பதிவில் வைக்கப்படும்.", uploaded: "பதிவேற்றப்பட்டது:",
  },
  bn: {
    title: "পূর্বের প্রেসক্রিপশন",
    back: "ফিরে যান",
    backDashboard: "ড্যাশবোর্ডে ফিরে যান",
    open: "ফাইল খুলুন",
    delete: "প্রেসক্রিপশন মুছুন",
    loading: "লোড হচ্ছে...",
    none: "এখনও কোনো প্রেসক্রিপশন আপলোড করা হয়নি।", records: "আপনার রেকর্ড", saved: "সংরক্ষিত ফাইল", actions: "রেকর্ডের কাজ", openAction: "প্রেসক্রিপশন খুলুন", deleteAction: "রেকর্ড মুছুন", returnAction: "স্ক্যানারে ফিরে যান", eyebrow: "রোগীর রেকর্ড · ডকুমেন্ট লাইব্রেরি", intro: "আপনার ক্লিনিক্যাল ইতিহাসে যোগ করা প্রেসক্রিপশনগুলো দেখুন।", history: "প্রেসক্রিপশন ইতিহাস", stored: "সংরক্ষিত নথি", privacy: "আপনার গোপনীয়তা", privacyText: "আপনি মুছে না দেওয়া পর্যন্ত নথিগুলো আপনার স্থানীয় ক্লিনিক্যাল রেকর্ডে রাখা হয়।", uploaded: "আপলোড:",
  },
} as const;

type PrescriptionRecord = {
  id: number;
  fileName: string;
  mimeType: string;
  base64Data: string;
  uploadedAt: string;
};

function openFile(record: PrescriptionRecord) {
  const bytes = Uint8Array.from(atob(record.base64Data), (character) => character.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: record.mimeType }));
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function PreviousPrescriptions() {
  const [records, setRecords] = useState<PrescriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState<LanguageCode>("en");
  const uiText = TEXT[language];

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("medikiosk_language") as LanguageCode | null;
    if (savedLanguage && savedLanguage in LANGUAGE_OPTIONS) setLanguage(savedLanguage);
  }, []);

  const fetchRecords = async () => {
    setRecords([]);
    setError("");
    try {
      const token = window.localStorage.getItem("medikiosk_access_token");
      if (!token) throw new Error("Please sign in before viewing prescriptions.");
      const response = await fetch(`/api/previous-prescriptions?user=${encodeURIComponent(window.localStorage.getItem("medikiosk_user_id") ?? "")}`, { cache: "no-store", headers: { Authorization: `Bearer ${token}`, "Cache-Control": "no-cache" } });
      const data = await response.json();
      if (response.status === 401) {
        window.localStorage.removeItem("medikiosk_access_token");
        window.localStorage.removeItem("medikiosk_user_id");
      }
      if (!response.ok) throw new Error(data.detail || "Could not load prescriptions.");
      setRecords(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load prescriptions.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/prescriptions/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${window.localStorage.getItem("medikiosk_access_token") ?? ""}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not delete prescription.");
      setRecords((current) => current.filter((record) => record.id !== id));
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete prescription.");
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  return (
    <div className="scanner-shell">
      <header className="scanner-topbar">
        <div className="scanner-brand"><div className="scanner-brand-mark">✚</div><div><strong>MEDIKIOSK</strong><small>CLINICAL INTAKE</small></div></div>
        <div className="scanner-top-actions"><select className="scanner-language" value={language} onChange={(e) => { const nextLanguage = e.target.value as LanguageCode; setLanguage(nextLanguage); window.localStorage.setItem("medikiosk_language", nextLanguage); }}>{Object.entries(LANGUAGE_OPTIONS).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select><Link href="/" className="scanner-dashboard">{uiText.backDashboard}</Link></div>
      </header>
      <main className="scanner-layout">
        <aside className="scanner-rail"><div className="scanner-kicker">{uiText.records}</div><div className="scanner-progress"><div className="scanner-progress-track"><span style={{ height: records.length ? "100%" : "0%" }} /></div><div><strong>{String(records.length).padStart(2, "0")}</strong><small>{uiText.saved}</small></div></div><div className="scanner-divider" /><div className="scanner-kicker">{uiText.actions}</div><ul className="scanner-steps"><li><span className="scanner-step-icon">◉</span>{uiText.openAction}</li><li><span className="scanner-step-icon">×</span>{uiText.deleteAction}</li><li><span className="scanner-step-icon">↩</span>{uiText.returnAction}</li></ul></aside>
        <section className="scanner-main">
          <div className="scanner-heading"><div className="scanner-eyebrow">{uiText.eyebrow}</div><h1>{uiText.title}</h1><p>{uiText.intro}</p></div>
          <div className="scanner-card"><div className="scanner-card-head"><div className="scanner-card-title"><span className="scanner-card-title-mark">◷</span><div><strong>{uiText.history}</strong><span>{uiText.stored}</span></div></div><Link href="/ocr-record" className="scanner-button scanner-button-secondary">{uiText.back}</Link></div><div className="scanner-card-body">
      {loading && <p>{uiText.loading}</p>}
      {error && <p style={{ color: "#B00020" }}>{error}</p>}
      {!loading && !error && records.length === 0 && <p style={{ color: "#555" }}>{uiText.none}</p>}
      <div>
        {records.map((record) => {
          const dataUrl = `data:${record.mimeType};base64,${record.base64Data}`;
          return (
            <div key={record.id} className="scanner-summary" style={{ marginTop: "0", marginBottom: "16px" }}>
              <p style={{ margin: 0, fontWeight: 600, color: "#4A6741" }}>{record.fileName}</p>
              <p style={{ margin: "4px 0", fontSize: "13px", color: "#777" }}>{uiText.uploaded} {new Date(record.uploadedAt).toLocaleString()}</p>
              {record.mimeType.startsWith("image/") && <img src={dataUrl} alt={record.fileName} style={{ maxWidth: "100%", marginTop: "10px", borderRadius: "6px" }} />}
              <div style={{ marginTop: "12px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button className="scanner-button scanner-button-secondary" onClick={() => openFile(record)}>{uiText.open}</button>
                <button className="scanner-button" style={{ color: "#fff", background: "#b00020" }} onClick={() => handleDelete(record.id)}>{uiText.delete}</button>
              </div>
            </div>
          );
        })}
      </div>
          </div></div>
        </section>
        <aside className="scanner-side"><div className="scanner-side-card"><strong>{uiText.privacy}</strong><p>{uiText.privacyText}</p></div></aside>
      </main>
    </div>
  );
}
