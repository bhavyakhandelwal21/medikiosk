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
    dashboard: "Back to Dashboard",
    pageTitle: "MediKiosk — OCR",
    clinicalIntake: "CLINICAL INTAKE",
    whatYouCanDo: "WHAT YOU CAN DO",
    uploadPrescription: "Upload a prescription",
    generateSummary: "Generate a clear summary",
    reviewRecords: "Review past records",
    historyNote: "Your files stay connected to your clinical history.",
    workspace: "PRESCRIPTION WORKSPACE",
    multilingual: "MULTILINGUAL",
    documentAssistant: "Document assistant",
    readyToRead: "Ready to read your prescription",
    dropTitle: "Drop your prescription here",
    dropHint: "PNG, JPG, or PDF · Multiple files supported",
    privateByDesign: "PRIVATE BY DESIGN",
    privateNote: "Your uploaded documents are used only to prepare this intake summary.",
    keepItSimple: "Keep it simple",
    clearImage: "Use a well-lit, flat image for the clearest reading.",
    viewPrev: "View Previous Prescriptions",
    summaryLang: "Summary language:",
    uploadFiles: "Upload Files",
    remove: "remove",
    selected: "file selected",
    files: "files selected",
    summarize: "Summarize All",
    reading: "Reading documents...",
    combined: "Combined Extracted Summary",
    mainConcern: "Main Concern",
    symptomTimeline: "Symptom Timeline",
    allergies: "Allergies",
    meds: "Medications and Supplements",
    vitals: "Vital Signs",
    doctorSummary: "Doctor Summary",
    confidence: "Confidence Score",
    notFound: "Not found",
    noneFound: "None found",
  },
  hi: {
    dashboard: "डैशबोर्ड पर वापस",
    pageTitle: "MediKiosk — OCR",
    clinicalIntake: "क्लिनिकल इंटेक",
    whatYouCanDo: "आप क्या कर सकते हैं",
    uploadPrescription: "प्रिस्क्रिप्शन अपलोड करें",
    generateSummary: "स्पष्ट सारांश बनाएं",
    reviewRecords: "पिछले रिकॉर्ड देखें",
    historyNote: "आपकी फाइलें आपके क्लिनिकल इतिहास से जुड़ी रहती हैं।",
    workspace: "प्रिस्क्रिप्शन कार्यक्षेत्र",
    multilingual: "बहुभाषी",
    documentAssistant: "दस्तावेज़ सहायक",
    readyToRead: "आपका प्रिस्क्रिप्शन पढ़ने के लिए तैयार",
    dropTitle: "अपना प्रिस्क्रिप्शन यहां डालें",
    dropHint: "PNG, JPG या PDF · एक से अधिक फाइलें समर्थित",
    privateByDesign: "गोपनीयता के लिए बनाया गया",
    privateNote: "आपके अपलोड किए गए दस्तावेज़ केवल इस इंटेक सारांश के लिए उपयोग किए जाते हैं।",
    keepItSimple: "सरल रखें",
    clearImage: "सबसे स्पष्ट रीडिंग के लिए अच्छी रोशनी वाली सपाट तस्वीर का उपयोग करें।",
    viewPrev: "पिछली प्रिस्क्रिप्शन देखें",
    summaryLang: "सारांश भाषा:",
    uploadFiles: "फाइल अपलोड करें",
    remove: "हटाएं",
    selected: "फाइल चयनित",
    files: "फाइलें चयनित",
    summarize: "सभी का सारांश बनाएं",
    reading: "दस्तावेज़ पढ़े जा रहे हैं...",
    combined: "संयुक्त निष्कर्षित सारांश",
    mainConcern: "मुख्य समस्या",
    symptomTimeline: "लक्षण समयरेखा",
    allergies: "एलर्जी",
    meds: "दवाएँ और सप्लीमेंट",
    vitals: "जीवन संकेत",
    doctorSummary: "डॉक्टर सारांश",
    confidence: "विश्वास स्कोर",
    notFound: "मिल नहीं सका",
    noneFound: "कोई नहीं मिला",
  },
  ta: {
    dashboard: "டாஷ்போர்டுக்கு திரும்பு",
    pageTitle: "MediKiosk — OCR",
    clinicalIntake: "மருத்துவ தகவல் சேகரிப்பு",
    whatYouCanDo: "நீங்கள் செய்யக்கூடியவை",
    uploadPrescription: "மருந்து சீட்டை பதிவேற்றவும்",
    generateSummary: "தெளிவான சுருக்கத்தை உருவாக்கவும்",
    reviewRecords: "முந்தைய பதிவுகளைப் பார்க்கவும்",
    historyNote: "உங்கள் கோப்புகள் உங்கள் மருத்துவ வரலாற்றுடன் இணைக்கப்பட்டிருக்கும்.",
    workspace: "மருந்து சீட்டு பணியிடம்",
    multilingual: "பல மொழி",
    documentAssistant: "ஆவண உதவியாளர்",
    readyToRead: "உங்கள் மருந்து சீட்டை படிக்க தயார்",
    dropTitle: "உங்கள் மருந்து சீட்டை இங்கே விடவும்",
    dropHint: "PNG, JPG அல்லது PDF · பல கோப்புகள் ஆதரிக்கப்படுகின்றன",
    privateByDesign: "தனியுரிமைக்காக வடிவமைக்கப்பட்டது",
    privateNote: "நீங்கள் பதிவேற்றும் ஆவணங்கள் இந்த மருத்துவ சுருக்கத்தைத் தயாரிக்க மட்டுமே பயன்படுத்தப்படும்.",
    keepItSimple: "எளிமையாக வைத்திருங்கள்",
    clearImage: "தெளிவான வாசிப்புக்கு நல்ல வெளிச்சத்தில் சமமான படத்தைப் பயன்படுத்தவும்.",
    viewPrev: "முந்தைய மருந்து பட்டியல்களைப் பார்க்கவும்",
    summaryLang: "சுருக்க மொழி:",
    uploadFiles: "கோப்புகளைப் பதிவேற்று",
    remove: "நீக்கு",
    selected: "கோப்பு தேர்ந்தெடுக்கப்பட்டது",
    files: "கோப்புகள் தேர்ந்தெடுக்கப்பட்டன",
    summarize: "அனைத்தையும் சுருக்கமாக்கு",
    reading: "கோப்புகள் வாசிக்கப்படுகின்றன...",
    combined: "ஒருங்கிணைந்த சுருக்க சுருக்கம்",
    mainConcern: "முக்கிய சிக்கல்",
    symptomTimeline: "அறிகுறி காலவரிசை",
    allergies: "ஒவ்வாமைகள்",
    meds: "மருந்துகள் மற்றும் சப்ளிமெண்ட்ஸ்",
    vitals: "உயிர் குறிகாட்டிகள்",
    doctorSummary: "டாக்டர் சுருக்கம்",
    confidence: "நம்பிக்கை மதிப்பெண்",
    notFound: "கிடைக்கவில்லை",
    noneFound: "எதுவும் இல்லை",
  },
  bn: {
    dashboard: "ড্যাশবোর্ডে ফিরে যান",
    pageTitle: "MediKiosk — OCR",
    clinicalIntake: "ক্লিনিক্যাল ইনটেক",
    whatYouCanDo: "আপনি যা করতে পারেন",
    uploadPrescription: "প্রেসক্রিপশন আপলোড করুন",
    generateSummary: "স্পষ্ট সারাংশ তৈরি করুন",
    reviewRecords: "আগের রেকর্ড দেখুন",
    historyNote: "আপনার ফাইলগুলো আপনার ক্লিনিক্যাল ইতিহাসের সঙ্গে সংযুক্ত থাকে।",
    workspace: "প্রেসক্রিপশন ওয়ার্কস্পেস",
    multilingual: "বহুভাষিক",
    documentAssistant: "ডকুমেন্ট সহায়ক",
    readyToRead: "আপনার প্রেসক্রিপশন পড়ার জন্য প্রস্তুত",
    dropTitle: "আপনার প্রেসক্রিপশন এখানে রাখুন",
    dropHint: "PNG, JPG বা PDF · একাধিক ফাইল সমর্থিত",
    privateByDesign: "গোপনীয়তার জন্য তৈরি",
    privateNote: "আপনার আপলোড করা নথি শুধুমাত্র এই ইনটেক সারাংশ তৈরিতে ব্যবহার করা হয়।",
    keepItSimple: "সহজ রাখুন",
    clearImage: "সবচেয়ে পরিষ্কারভাবে পড়ার জন্য ভালো আলোতে সমতল ছবি ব্যবহার করুন।",
    viewPrev: "পূর্বের প্রেসক্রিপশন দেখুন",
    summaryLang: "সারাংশ ভাষা:",
    uploadFiles: "ফাইল আপলোড করুন",
    remove: "মুছুন",
    selected: "ফাইল নির্বাচিত",
    files: "ফাইল নির্বাচিত",
    summarize: "সব কিছুর সারাংশ দেখুন",
    reading: "নথি পড়া হচ্ছে...",
    combined: "একত্রিত সারাংশ",
    mainConcern: "প্রধান সমস্যা",
    symptomTimeline: "লক্ষণ টাইমলাইন",
    allergies: "অ্যালার্জি",
    meds: "ওষুধ ও সম্পূরক",
    vitals: "ভিটাল লক্ষণ",
    doctorSummary: "ডাক্তার সারাংশ",
    confidence: "নির্ভরযোগ্যতা স্কোর",
    notFound: "পাওয়া যায়নি",
    noneFound: "কিছুই পাওয়া যায়নি",
  },
} as const;

async function compressImageIfNeeded(file: File): Promise<File> {
  // Only compress images, leave PDFs untouched
  if (!file.type.startsWith("image/")) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const MAX_DIMENSION = 1600;
      let { width, height } = img;

      if (width > height && width > MAX_DIMENSION) {
        height = Math.round((height * MAX_DIMENSION) / width);
        width = MAX_DIMENSION;
      } else if (height > MAX_DIMENSION) {
        width = Math.round((width * MAX_DIMENSION) / height);
        height = MAX_DIMENSION;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file); // fallback to original if compression fails
            return;
          }
          const compressedFile = new File([blob], file.name, {
            type: "image/jpeg",
          });
          resolve(compressedFile);
        },
        "image/jpeg",
        0.8 // 80% quality — good balance of size vs clarity
      );
    };

    reader.readAsDataURL(file);
  });
}

type SummaryResult = {
  main_concern?: string;
  symptom_timeline?: string;
  allergies?: string[];
  medications_supplements?: string[];
  vital_signs_mentioned?: string[];
  concise_doctor_summary?: string;
  confidence_score?: number | string;
  confidenceScore?: number | string;
  confidence?: number | string;
};

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState<LanguageCode>("en");
  const uiText = TEXT[language];

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("medikiosk_language") as LanguageCode | null;
    if (savedLanguage && savedLanguage in LANGUAGE_OPTIONS) setLanguage(savedLanguage);
  }, []);

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUpload() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("file", f));
      formData.append("language", LANGUAGE_OPTIONS[language]);

      const res = await fetch("/api/summarize-prescription", {
        method: "POST",
        headers: { Authorization: `Bearer ${window.localStorage.getItem("medikiosk_access_token") ?? ""}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.detail || "Failed to summarize documents.");
      }

      if (!data.cumulative_structured_data) {
        throw new Error("No summary was returned from the server.");
      }

      setResult(data.cumulative_structured_data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong reading these documents. Try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="scanner-shell">
      <header className="scanner-topbar">
        <div className="scanner-brand">
          <div className="scanner-brand-mark">✚</div>
          <div><strong>MEDIKIOSK</strong><small>{uiText.clinicalIntake}</small></div>
        </div>
        <div className="scanner-top-actions">
          <select className="scanner-language" value={language} onChange={(e) => { const nextLanguage = e.target.value as LanguageCode; setLanguage(nextLanguage); window.localStorage.setItem("medikiosk_language", nextLanguage); }} aria-label={uiText.summaryLang}>
            {Object.entries(LANGUAGE_OPTIONS).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </select>
          <button className="scanner-dashboard" type="button" onClick={() => window.location.assign("/dashboard")}>{uiText.dashboard}</button>
        </div>
      </header>

      <main className="scanner-layout">
        <aside className="scanner-rail">
          <div className="scanner-divider" />
          <div className="scanner-kicker">{uiText.whatYouCanDo}</div>
          <ul className="scanner-steps"><li><span className="scanner-step-icon">↥</span>{uiText.uploadPrescription}</li><li><span className="scanner-step-icon">✦</span>{uiText.generateSummary}</li><li><span className="scanner-step-icon">◷</span>{uiText.reviewRecords}</li></ul>
          <div className="scanner-rail-note"><span>●</span><div>{uiText.historyNote}</div></div>
        </aside>

        <section className="scanner-main">
          <div className="scanner-heading"><div className="scanner-eyebrow">{uiText.workspace} <span>·</span> {uiText.multilingual}</div><h1>{uiText.pageTitle}</h1></div>
          <div className="scanner-card">
            <div className="scanner-card-head"><div className="scanner-card-title"><span className="scanner-card-title-mark">✦</span><div><strong>{uiText.documentAssistant}</strong><span>{uiText.readyToRead}</span></div></div><Link href="/previous-prescriptions" className="scanner-button scanner-button-secondary">{uiText.viewPrev}</Link></div>
            <div className="scanner-card-body">

      <input
        type="file"
        accept="application/pdf,image/*"
        multiple
        id="fileInput"
        style={{ display: "none" }}
        onChange={async (e) => {
          const selected = Array.from(e.target.files ?? []);
          setResult(null);
          setError("");
          e.target.value = "";

          // Compress any images before adding them to the list
          const processed = await Promise.all(
            selected.map((f) => compressImageIfNeeded(f))
          );
          setFiles((prev) => [...prev, ...processed]);
        }}
      />

      <div className="scanner-dropzone"><div><strong>{uiText.dropTitle}</strong><span>{uiText.dropHint}</span></div></div>

      <button
        className="scanner-button scanner-button-secondary"
        onClick={() => document.getElementById("fileInput")?.click()}
      >
        📄 {uiText.uploadFiles}
      </button>

      {files.length > 0 && (
        <div>
          <p style={{ color: "#555", marginBottom: "6px" }}>
            <b>{files.length}</b> {files.length > 1 ? uiText.files : uiText.selected}:
          </p>
          <ul className="scanner-files">
            {files.map((f, i) => (
              <li key={i} style={{ marginBottom: "4px" }}>
                {f.name}{" "}
                <button
                  onClick={() => removeFile(i)}
                  className="scanner-remove"
                >
                  {uiText.remove}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        className="scanner-button scanner-button-primary"
        onClick={handleUpload}
        disabled={loading}
        style={{ marginTop: "20px" }}
      >
        {loading ? uiText.reading : uiText.summarize}
      </button>

      {error && <p style={{ color: "#B00020", marginTop: "20px" }}>{error}</p>}

      {result && (
        <div className="scanner-summary">
          <h2>{uiText.combined}</h2>
          <p style={{ color: "#000" }}>
            <b style={{ color: "#000" }}>{uiText.mainConcern}:</b> {result.main_concern || uiText.notFound}
          </p>
          <p style={{ color: "#000" }}>
            <b style={{ color: "#000" }}>{uiText.symptomTimeline}:</b> {result.symptom_timeline || uiText.notFound}
          </p>
          <p style={{ color: "#000" }}>
            <b style={{ color: "#000" }}>{uiText.allergies}:</b> {result.allergies?.join(", ") || uiText.noneFound}
          </p>
          <div style={{ color: "#000" }}>
            <b>{uiText.meds}:</b>
            <ul style={{ marginTop: "8px", color: "#000" }}>
              {result.medications_supplements?.map((medication: string, i: number) => (
                <li key={i} style={{ color: "#000" }}>{medication}</li>
              ))}
            </ul>
          </div>
          <p style={{ color: "#000" }}>
            <b style={{ color: "#000" }}>{uiText.vitals}:</b>
          </p>
          <ul style={{ color: "#000" }}>
            {result.vital_signs_mentioned?.map((vital: string, i: number) => (
              <li key={i} style={{ color: "#000" }}>{vital}</li>
            ))}
          </ul>
          <p style={{ color: "#000" }}>
            <b style={{ color: "#000" }}>{uiText.doctorSummary}:</b> {result.concise_doctor_summary}
          </p>
          <p className="scanner-confidence">
            <b>{uiText.confidence}:</b> {result.confidence_score ?? result.confidenceScore ?? result.confidence ?? "N/A"}
          </p>
        </div>
      )}
            </div>
          </div>
        </section>

        <aside className="scanner-side">
          <div className="scanner-side-card"><strong>{uiText.privateByDesign}</strong><p>{uiText.privateNote}</p></div>
          <div className="scanner-side-note"><i /><div><strong>{uiText.keepItSimple}</strong><p>{uiText.clearImage}</p></div></div>
        </aside>
      </main>
    </div>
  );
}