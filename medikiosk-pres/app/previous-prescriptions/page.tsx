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
    none: "No prescriptions uploaded yet.",
  },
  hi: {
    title: "पिछली प्रिस्क्रिप्शन",
    back: "वापस",
    backDashboard: "डैशबोर्ड पर वापस",
    open: "फाइल खोलें",
    delete: "प्रिस्क्रिप्शन हटाएं",
    loading: "लोड हो रहा है...",
    none: "अभी तक कोई प्रिस्क्रिप्शन अपलोड नहीं हुआ है।",
  },
  ta: {
    title: "முந்தைய மருந்து பட்டியல்கள்",
    back: "திரும்பு",
    backDashboard: "டாஷ்போர்டுக்கு திரும்பு",
    open: "கோப்பைத் திற",
    delete: "மருந்து பட்டியலை நீக்கு",
    loading: "ஏற்றுகிறது...",
    none: "இதுவரை எந்த மருந்து பட்டியலும் பதிவேற்றப்படவில்லை.",
  },
  bn: {
    title: "পূর্বের প্রেসক্রিপশন",
    back: "ফিরে যান",
    backDashboard: "ড্যাশবোর্ডে ফিরে যান",
    open: "ফাইল খুলুন",
    delete: "প্রেসক্রিপশন মুছুন",
    loading: "লোড হচ্ছে...",
    none: "এখনও কোনো প্রেসক্রিপশন আপলোড করা হয়নি।",
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

  const fetchRecords = async () => {
    try {
      const response = await fetch("/api/previous-prescriptions");
      const data = await response.json();
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
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
      const response = await fetch(`${backendUrl}/api/prescriptions/${id}`, { method: "DELETE" });
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
        <div className="scanner-top-actions"><select className="scanner-language" value={language} onChange={(e) => setLanguage(e.target.value as LanguageCode)}>{Object.entries(LANGUAGE_OPTIONS).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select><Link href="/" className="scanner-dashboard">{uiText.back}</Link></div>
      </header>
      <main className="scanner-layout">
        <aside className="scanner-rail"><div className="scanner-kicker">YOUR RECORDS</div><div className="scanner-progress"><div className="scanner-progress-track"><span style={{ height: records.length ? "100%" : "0%" }} /></div><div><strong>{String(records.length).padStart(2, "0")}</strong><small>Saved files</small></div></div><div className="scanner-divider" /><div className="scanner-kicker">RECORD ACTIONS</div><ul className="scanner-steps"><li><span className="scanner-step-icon">◉</span>Open a prescription</li><li><span className="scanner-step-icon">×</span>Delete a record</li><li><span className="scanner-step-icon">↩</span>Return to scanner</li></ul></aside>
        <section className="scanner-main">
          <div className="scanner-heading"><div className="scanner-eyebrow">PATIENT RECORDS <span>·</span> DOCUMENT LIBRARY</div><h1>{uiText.title}</h1><p>Review the prescriptions previously added to your clinical history.</p></div>
          <div className="scanner-card"><div className="scanner-card-head"><div className="scanner-card-title"><span className="scanner-card-title-mark">◷</span><div><strong>Prescription history</strong><span>Stored documents</span></div></div><Link href="/" className="scanner-button scanner-button-secondary">{uiText.back}</Link></div><div className="scanner-card-body">
      {loading && <p>{uiText.loading}</p>}
      {error && <p style={{ color: "#B00020" }}>{error}</p>}
      {!loading && !error && records.length === 0 && <p style={{ color: "#555" }}>{uiText.none}</p>}
      <div>
        {records.map((record) => {
          const dataUrl = `data:${record.mimeType};base64,${record.base64Data}`;
          return (
            <div key={record.id} className="scanner-summary" style={{ marginTop: "0", marginBottom: "16px" }}>
              <p style={{ margin: 0, fontWeight: 600, color: "#4A6741" }}>{record.fileName}</p>
              <p style={{ margin: "4px 0", fontSize: "13px", color: "#777" }}>Uploaded: {new Date(record.uploadedAt).toLocaleString()}</p>
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
        <aside className="scanner-side"><div className="scanner-side-card"><strong>YOUR PRIVACY</strong><p>Documents are kept in your local clinical record until you delete them.</p></div></aside>
      </main>
    </div>
  );
}
