import React, { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, MessageSquare, Send, Sparkles, X } from "lucide-react";
import { api } from "../services/api";
import { RegionalLanguage, useUISettings } from "../context/UISettingsContext";

interface Message { sender: "bot" | "user"; text: string; }
type Copy = { welcome: string; status: string; placeholder: string; quick: string[]; send: string; busy: string; local: string; connected: string; }

const copyByLanguage: Partial<Record<RegionalLanguage, Copy>> = {
  English: { welcome: "Namaste! Ask about GeoVISTA, 3D ULPIN, vertical property mapping, the city datasets, or the prototype checks. This guide stays within the project scope; it cannot verify ownership or issue an official ULPIN.", status: "GeoVISTA and 3D ULPIN help · multilingual", placeholder: "Ask about GeoVISTA or 3D ULPIN…", quick: ["3D ULPIN concept", "Vertical floors", "Prototype validation", "Data sources"], send: "Send", busy: "Thinking…", local: "Local guide · LLM key not configured", connected: "Groq LLM · project-scoped" },
  "हिन्दी": { welcome: "नमस्ते! GeoVISTA, 3D ULPIN, ऊर्ध्वाधर संपत्ति मानचित्रण, शहर के डेटासेट या प्रोटोटाइप जाँच के बारे में पूछें। यह सहायक परियोजना तक सीमित है; यह स्वामित्व सत्यापित या आधिकारिक ULPIN जारी नहीं करता।", status: "GeoVISTA और 3D ULPIN सहायता · बहुभाषी", placeholder: "GeoVISTA या 3D ULPIN के बारे में पूछें…", quick: ["3D ULPIN अवधारणा", "ऊर्ध्व मंज़िलें", "प्रोटोटाइप सत्यापन", "डेटा स्रोत"], send: "भेजें", busy: "सोच रहा है…", local: "स्थानीय सहायता · LLM कुंजी कॉन्फ़िगर नहीं", connected: "Groq LLM · परियोजना तक सीमित" },
  "मराठी": { welcome: "नमस्कार! GeoVISTA, 3D ULPIN, उभ्या मालमत्ता नकाशांकन, शहराचे डेटासेट किंवा प्रोटोटाइप तपासण्यांबद्दल विचारा. हा सहाय्यक प्रकल्पापुरता मर्यादित आहे; तो मालकीची पडताळणी किंवा अधिकृत ULPIN जारी करत नाही.", status: "GeoVISTA आणि 3D ULPIN मदत · बहुभाषिक", placeholder: "GeoVISTA किंवा 3D ULPIN बद्दल विचारा…", quick: ["3D ULPIN संकल्पना", "मजले", "प्रोटोटाइप तपासणी", "डेटा स्रोत"], send: "पाठवा", busy: "विचार करत आहे…", local: "स्थानिक मार्गदर्शक · LLM key सेट नाही", connected: "Groq LLM · प्रकल्पापुरते" },
  "বাংলা": { welcome: "নমস্কার! GeoVISTA, 3D ULPIN, উল্লম্ব সম্পত্তি মানচিত্র, শহরের ডেটাসেট বা প্রোটোটাইপ যাচাই সম্পর্কে জিজ্ঞাসা করুন। সহায়কটি প্রকল্পের মধ্যেই সীমাবদ্ধ; এটি মালিকানা যাচাই বা সরকারি ULPIN দেয় না।", status: "GeoVISTA ও 3D ULPIN সহায়তা · বহুভাষিক", placeholder: "GeoVISTA বা 3D ULPIN সম্পর্কে জিজ্ঞাসা করুন…", quick: ["3D ULPIN ধারণা", "তলা", "প্রোটোটাইপ যাচাই", "ডেটা উৎস"], send: "পাঠান", busy: "ভাবছে…", local: "স্থানীয় সহায়ক · LLM key সেট করা নেই", connected: "Groq LLM · প্রকল্প সীমাবদ্ধ" },
  "தமிழ்": { welcome: "வணக்கம்! GeoVISTA, 3D ULPIN, செங்குத்துச் சொத்து வரைபடம், நகரத் தரவுத்தொகுப்புகள் அல்லது முன்மாதிரி சரிபார்ப்புகள் பற்றி கேளுங்கள். இந்த உதவியாளர் திட்டத்திற்குள் மட்டுமே பதிலளிக்கும்; உரிமையைச் சரிபார்க்கவோ அதிகாரப்பூர்வ ULPIN வழங்கவோ முடியாது.", status: "GeoVISTA மற்றும் 3D ULPIN உதவி · பலமொழி", placeholder: "GeoVISTA அல்லது 3D ULPIN பற்றி கேளுங்கள்…", quick: ["3D ULPIN கருத்து", "தளங்கள்", "முன்மாதிரி சரிபார்ப்பு", "தரவு ஆதாரம்"], send: "அனுப்பு", busy: "சிந்திக்கிறது…", local: "உள்ளூர் வழிகாட்டி · LLM key அமைக்கப்படவில்லை", connected: "Groq LLM · திட்ட வரம்பில்" },
};

const defaultCopy: Copy = {
  welcome: "Namaste! Ask about GeoVISTA, 3D ULPIN, vertical property mapping, city datasets, or prototype checks. Answers stay within the project scope and are not official cadastral decisions.",
  status: "GeoVISTA and 3D ULPIN help · multilingual",
  placeholder: "Ask about GeoVISTA or 3D ULPIN…",
  quick: ["3D ULPIN concept", "Vertical floors", "Prototype validation", "Data sources"],
  send: "Send", busy: "Thinking…", local: "Local guide · LLM key not configured", connected: "Groq LLM · project-scoped",
};

function localAnswer(prompt: string, language: RegionalLanguage) {
  const normalized = prompt.toLocaleLowerCase();
  const hindi = language === "हिन्दी";
  const marathi = language === "मराठी";
  const contains = (...terms: string[]) => terms.some((term) => normalized.includes(term));
  const topic = ["geovista", "3d", "ulpin", "parcel", "property", "building", "floor", "vertical", "cadastre", "cadastral", "map", "dataset", "validation", "elevation", "underground", "bhopal", "nyc", "new york", "confidence", "source", "layer", "ownership", "portal", "website", "road", "tree"];
  if (!contains(...topic)) return hindi
    ? "मैं GeoVISTA और 3D ULPIN प्रोटोटाइप तक सीमित हूँ। शहर का चयन, भवन/पार्सल, ऊर्ध्व मंज़िलें, Z-range, स्रोत या तकनीकी जाँच के बारे में पूछें।"
    : marathi
      ? "मी GeoVISTA आणि 3D ULPIN प्रोटोटाइपपुरता मर्यादित आहे. शहर, इमारत/पार्सल, मजले, Z-range, स्रोत किंवा तांत्रिक तपासणीबद्दल विचारा."
      : "I can help with GeoVISTA and the 3D ULPIN prototype. Ask about city selection, buildings/parcels, vertical floors, Z ranges, provenance, or technical checks.";
  if (contains("3d ulpin", "3d id", "identifier", "identity", "पहचान", "ओळख")) return hindi
    ? "डेमो 3D ULPIN अवधारणा पार्सल पहचान + भवन पहचान + ऊर्ध्व मंज़िल + Z-range + spatial reference को जोड़ती है। दिखाया गया ID प्रोटोटाइप है, सरकारी ULPIN नहीं।"
    : marathi
      ? "डेमो 3D ULPIN संकल्पना पार्सल + इमारत + मजला + Z-range + spatial reference जोडते. दाखवलेला ID प्रोटोटाइप आहे, सरकारी ULPIN नाही."
      : "The demo 3D ULPIN concept combines parcel identity, building identity, a vertical level, Z range, and spatial reference. Any ID shown is a prototype identifier, not an official government ULPIN.";
  if (contains("floor", "level", "storey", "मंज़िल", "मजला", "तल", "தள")) return hindi
    ? "जहाँ स्रोत floor plans उपलब्ध नहीं हैं, viewer उपलब्ध ऊँचाई/मंज़िल गुणों से समान ऊँचाई वाले floor bands निकालता है। इन्हें surveyed ownership units न मानें।"
    : "Where source floor plans are unavailable, the viewer derives equal-height floor bands from available building height/floor attributes. These are not surveyed ownership units.";
  if (contains("valid", "check", "validation", "topology", "सत्यापन", "जाँच", "तपासणी")) return hindi
    ? "प्रोटोटाइप जाँच geometry, parcel/building linkage, height, Z-range, floor consistency और 3D volume देखती है। यह कानूनी या सरकारी cadastral validation नहीं है।"
    : "Prototype checks examine geometry, parcel/building linkage, height, Z range, floor consistency, and volume generation. They are technical checks, not official or legal cadastral validation.";
  if (contains("source", "data", "provenance", "dataset", "स्रोत", "डेटा")) return hindi
    ? "Bhopal मोड स्थानीय GeoVISTA building GeoJSON उपयोग करता है। NYC reference मोड सार्वजनिक NYC building footprint और MapPLUTO नमूने उपयोग करता है; वह आधिकारिक cadastre नहीं है।"
    : "Bhopal uses the local GeoVISTA building GeoJSON. NYC reference mode uses public NYC building-footprint and MapPLUTO samples; it is not an official cadastre.";
  if (contains("ownership", "owner", "legal", "मालिक", "स्वामित्व")) return hindi
    ? "इस prototype से ownership, title या legal rights निर्धारित नहीं होते। यह केवल source-labelled geometry और technical workflow दिखाता है।"
    : "This prototype does not determine ownership, title, or legal rights. It displays source-labelled geometry and a technical workflow only.";
  return hindi
    ? "GeoVISTA 2D parcel context को buildings, vertical levels, elevation, underground concepts और prototype validation के साथ 3D cadastre workflow में जोड़ता है। Reference data और derived attributes स्पष्ट रूप से चिह्नित हैं।"
    : "GeoVISTA combines parcel context with buildings, vertical levels, elevation, conceptual underground layers, and prototype validation in a 3D cadastre workflow. Reference data and derived attributes are labelled.";
}

export const GuidedAssistant: React.FC = () => {
  const { language } = useUISettings();
  const copy = copyByLanguage[language] ?? defaultCopy;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ sender: "bot", text: copy.welcome }]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [llmConfigured, setLlmConfigured] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages((previous) => previous.length === 1 && previous[0].sender === "bot" ? [{ sender: "bot", text: copy.welcome }] : previous);
  }, [copy.welcome]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, pending]);

  const sendPrompt = async (text: string) => {
    const question = text.trim().slice(0, 1200);
    if (!question || pending) return;
    setInput("");
    setPending(true);
    setMessages((previous) => [...previous, { sender: "user", text: question }]);
    try {
      const result = await api.chatWithAssistant(question, language);
      setLlmConfigured(result.providerConfigured);
      const reply = result.scopeRejected || result.providerConfigured ? result.reply : localAnswer(question, language);
      setMessages((previous) => [...previous, { sender: "bot", text: reply }]);
    } catch {
      setLlmConfigured(false);
      setMessages((previous) => [...previous, { sender: "bot", text: localAnswer(question, language) }]);
    } finally {
      setPending(false);
    }
  };

  const submit = (event: FormEvent) => { event.preventDefault(); void sendPrompt(input); };
  const status = llmConfigured === true ? copy.connected : llmConfigured === false ? copy.local : copy.status;

  return (
    <div className="fixed bottom-3 right-3 z-40 sm:bottom-5 sm:right-5">
      {isOpen ? (
        <section className="flex h-[min(70dvh,34rem)] w-[min(26rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:h-[min(75dvh,38rem)]" aria-label="GeoVISTA Guided Assistant">
          <header className="flex items-center justify-between gap-2 bg-blue-950 px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-2.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-800"><Bot className="h-4 w-4 text-blue-200" /></span><div className="min-w-0"><h2 className="truncate text-xs font-bold">GeoVISTA Guided Assistant</h2><span className="block truncate text-[10px] text-blue-200">{status}</span></div></div>
            <button onClick={() => setIsOpen(false)} aria-label="Close assistant" className="rounded-lg p-1.5 text-blue-100 hover:bg-blue-800"><X className="h-4 w-4" /></button>
          </header>
          <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto bg-slate-50 p-3 text-xs sm:p-4">
            {messages.map((message, index) => <div key={`${index}-${message.sender}`} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] whitespace-pre-wrap rounded-xl px-3 py-2.5 leading-relaxed ${message.sender === "user" ? "rounded-br-sm bg-blue-900 text-white" : "rounded-bl-sm border border-slate-200 bg-white text-slate-800"}`}>{message.text}</div></div>)}
            {pending && <div className="max-w-[88%] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-500">{copy.busy}</div>}
          </div>
          <div className="flex flex-wrap gap-1.5 border-t border-slate-200 bg-white px-3 py-2">{copy.quick.map((prompt) => <button key={prompt} onClick={() => void sendPrompt(prompt)} disabled={pending} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-[10px] font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50">{prompt}</button>)}</div>
          <form onSubmit={submit} className="flex items-center gap-2 border-t border-slate-200 bg-white p-2.5 sm:p-3"><input value={input} onChange={(event) => setInput(event.target.value)} maxLength={1200} placeholder={copy.placeholder} aria-label={copy.placeholder} className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /><button type="submit" disabled={!input.trim() || pending} aria-label={copy.send} title={copy.send} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-900 text-white transition hover:bg-blue-800 disabled:opacity-50"><Send className="h-4 w-4" /></button></form>
          <p className="border-t border-slate-100 px-3 py-1.5 text-[9px] leading-relaxed text-slate-500">Project guidance only · no ownership decisions · personal profile data is never sent to the assistant.</p>
        </section>
      ) : (
        <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 rounded-full bg-blue-950 px-4 py-2.5 text-white shadow-lg transition hover:bg-blue-900"><Sparkles className="h-4 w-4 text-blue-200" /><span className="text-xs font-bold">{language === "हिन्दी" ? "मार्गदर्शक सहायक" : "Guided Assistant"}</span><MessageSquare className="h-3.5 w-3.5 opacity-70" /></button>
      )}
    </div>
  );
};
