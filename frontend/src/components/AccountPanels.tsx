import React, { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, CircleHelp, LockKeyhole, Send, Settings2, ShieldCheck, Smartphone, UserRound, X } from "lucide-react";
import { AuthUser } from "../services/api";
import { CityMode, RegionalLanguage, ThemePreference, useUISettings } from "../context/UISettingsContext";

export type AccountPanel = "profile" | "settings" | "help" | null;

type DemoProfile = {
  name: string;
  mobile: string;
  aadhaarLast4: string;
  demoVerified: true;
  completedAt: string;
};

const profileKey = (user: AuthUser) => `geovista.profile.demo.v1:${user.id}`;

export function readDemoProfile(user: AuthUser | null): DemoProfile | null {
  if (!user) return null;
  try {
    const value = JSON.parse(localStorage.getItem(profileKey(user)) ?? "null") as Partial<DemoProfile> | null;
    return value?.demoVerified && value.aadhaarLast4 && value.mobile
      ? value as DemoProfile
      : null;
  } catch {
    return null;
  }
}

interface AccountPanelsProps {
  panel: AccountPanel;
  user: AuthUser | null;
  onClose: () => void;
  onProfileSaved: () => void;
}

const languageOptions: RegionalLanguage[] = ["English", "हिन्दी", "मराठी", "বাংলা", "தமிழ்", "తెలుగు", "ಕನ್ನಡ", "ગુજરાતી", "ਪੰਜਾਬੀ"];

export function AccountPanels({ panel, user, onClose, onProfileSaved }: AccountPanelsProps) {
  const settings = useUISettings();
  if (!panel) return null;

  const heading = panel === "profile" ? "Profile" : panel === "settings" ? "Settings" : "Help & Support";
  const Icon = panel === "profile" ? UserRound : panel === "settings" ? Settings2 : CircleHelp;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[min(88dvh,760px)] sm:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="account-panel-title">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Icon size={19} /></span><div><h2 id="account-panel-title" className="text-base font-bold text-slate-900">{heading}</h2><p className="text-xs text-slate-500">GeoVISTA account · prototype workspace</p></div></div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
        </header>
        <div className="overflow-y-auto p-5 sm:p-6">
          {panel === "profile" && user && <ProfileForm user={user} onProfileSaved={onProfileSaved} />}
          {panel === "settings" && <SettingsForm settings={settings} />}
          {panel === "help" && <HelpPanel />}
        </div>
      </section>
    </div>
  );
}

function ProfileForm({ user, onProfileSaved }: { user: AuthUser; onProfileSaved: () => void }) {
  const saved = useMemo(() => readDemoProfile(user), [user]);
  const [name, setName] = useState(saved?.name ?? user.name);
  const [mobile, setMobile] = useState(saved?.mobile ?? "");
  const [aadhaar, setAadhaar] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [savedNow, setSavedNow] = useState(false);
  const mobileDigits = mobile.replace(/\D/g, "");
  const aadhaarDigits = aadhaar.replace(/\D/g, "");

  const sendDemoOtp = () => {
    setError("");
    if (!name.trim() || mobileDigits.length !== 10 || aadhaarDigits.length !== 12) {
      setError("Enter your name, a 10-digit mobile number and a 12-digit Aadhaar number to continue.");
      return;
    }
    setOtpSent(true);
    setOtp("");
    setSavedNow(false);
  };

  const verifyDemoOtp = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (otp.trim() !== "123456") {
      setError("For this demo, enter the sample OTP shown below.");
      return;
    }
    const profile: DemoProfile = {
      name: name.trim(),
      mobile: mobileDigits,
      aadhaarLast4: aadhaarDigits.slice(-4),
      demoVerified: true,
      completedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(profileKey(user), JSON.stringify(profile));
      setAadhaar("");
      setSavedNow(true);
      onProfileSaved();
    } catch {
      setError("Could not save this demo profile in browser storage.");
    }
  };

  return (
    <form className="space-y-4" onSubmit={verifyDemoOtp}>
      {saved && <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"><CheckCircle2 className="mt-0.5 shrink-0" size={18} /><div><div className="font-bold">Profile complete · Demo verified</div><div className="mt-0.5 text-xs">This status records the local prototype flow only. It is not UIDAI, identity or government verification.</div></div></div>}
      {saved && !savedNow && <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2"><div><div className="text-xs text-slate-500">Profile name</div><div className="mt-1 font-semibold text-slate-800">{saved.name}</div></div><div><div className="text-xs text-slate-500">Mobile (demo)</div><div className="mt-1 font-semibold text-slate-800">+91 {saved.mobile}</div></div><div className="sm:col-span-2"><div className="text-xs text-slate-500">Aadhaar reference</div><div className="mt-1 font-semibold text-slate-800">•••• •••• {saved.aadhaarLast4}</div></div></div>}

      <label className="block text-sm font-semibold text-slate-700">Full name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">Mobile number<input value={mobile} onChange={(event) => setMobile(event.target.value)} inputMode="numeric" autoComplete="tel-national" maxLength={14} placeholder="10-digit number" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
        <label className="block text-sm font-semibold text-slate-700">Aadhaar number<input value={aadhaar} onChange={(event) => setAadhaar(event.target.value.replace(/[^\d\s-]/g, "").slice(0, 14))} inputMode="numeric" autoComplete="off" maxLength={14} placeholder={saved ? "Re-enter to update" : "12 digits"} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
      </div>
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900"><LockKeyhole className="mt-0.5 shrink-0" size={15} /><span>Prototype only: OTP is simulated in this browser; no SMS or UIDAI check occurs. The full Aadhaar number is never saved or sent to the backend. Only its last four digits and the mobile number are stored in this browser.</span></div>
      {!otpSent ? <button type="button" onClick={sendDemoOtp} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-sm font-bold text-white hover:bg-blue-800"><Smartphone size={16} />Send demo OTP</button> : <>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900"><b>Sample OTP: 123456</b> · shown only to demonstrate the flow; it was not sent to your phone.</div>
        <label className="block text-sm font-semibold text-slate-700">Enter demo OTP<input value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6-digit code" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
        <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800"><ShieldCheck size={16} />Verify demo profile</button>
      </>}
      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {savedNow && <p role="status" className="text-sm font-semibold text-emerald-700">Saved in this browser. Profile menu now shows Demo Verified.</p>}
    </form>
  );
}

function SettingsForm({ settings }: { settings: ReturnType<typeof useUISettings> }) {
  const themes: Array<[ThemePreference, string]> = [["light", "Light"], ["dark", "Dark"], ["system", "System"]];
  const cities: Array<[CityMode, string]> = [["bhopal", "Bhopal · India"], ["reference", "New York City"]];
  return <div className="space-y-5">
    <div><h3 className="text-sm font-bold text-slate-800">Appearance</h3><div className="mt-2 grid grid-cols-3 gap-2">{themes.map(([value, label]) => <button key={value} onClick={() => settings.setTheme(value)} aria-pressed={settings.theme === value} className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${settings.theme === value ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>{label}</button>)}</div></div>
    <label className="block text-sm font-semibold text-slate-700">Regional language<select value={settings.language} onChange={(event) => settings.setLanguage(event.target.value as RegionalLanguage)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900">{languageOptions.map((language) => <option key={language}>{language}</option>)}</select></label>
    <div><h3 className="text-sm font-bold text-slate-800">3D City</h3><p className="mt-1 text-xs text-slate-500">Changing the city updates the Public Portal viewer and the location label in the navbar.</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{cities.map(([value, label]) => <button key={value} onClick={() => settings.setCity(value)} aria-pressed={settings.city === value} className={`rounded-lg border px-3 py-3 text-left text-sm font-semibold ${settings.city === value ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>{label}<span className="mt-1 block text-[11px] font-normal text-slate-500">{value === "bhopal" ? "Actual project dataset" : "Reference / prototype data"}</span></button>)}</div></div>
    <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">Language, theme and city preferences are saved in this browser. Map source attributes remain in their original language where no translation is available.</p>
  </div>;
}

function HelpPanel() {
  const [description, setDescription] = useState("");
  const [notice, setNotice] = useState("");
  const faqs = [
    ["What is a 3D ULPIN in this prototype?", "A demonstration property identity concept that combines parcel/building references with a vertical level and Z range. IDs shown here are not government-issued."],
    ["Are floor boundaries legal or surveyed?", "No. Where source floor plans are unavailable, floors are derived from building height and clearly represent a prototype subdivision."],
    ["What does validation mean?", "The viewer runs technical geometry and range checks. It does not certify ownership, title, or official cadastral validity."],
    ["Why does New York City use reference labels?", "NYC demonstrates how the workflow can use open city datasets; it is not an official cadastral deployment."],
  ];
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (description.trim().length < 8) { setNotice("Please describe the issue in a little more detail."); return; }
    try {
      const reports = JSON.parse(localStorage.getItem("geovista.demo.support-reports") ?? "[]") as Array<{ id: string; message: string; createdAt: string }>;
      reports.unshift({ id: `GV-DEMO-${Date.now().toString(36).toUpperCase()}`, message: description.trim().slice(0, 1200), createdAt: new Date().toISOString() });
      localStorage.setItem("geovista.demo.support-reports", JSON.stringify(reports.slice(0, 20)));
      setDescription("");
      setNotice("Demo support note saved in this browser. It was not sent to a support team.");
    } catch { setNotice("Could not save the demo note in browser storage."); }
  };
  return <div className="space-y-5">
    <section><h3 className="text-sm font-bold text-slate-800">Frequently asked</h3><div className="mt-2 divide-y divide-slate-200 rounded-xl border border-slate-200">{faqs.map(([question, answer]) => <details key={question} className="group px-4 py-3"><summary className="cursor-pointer list-none pr-4 text-sm font-semibold text-slate-800 marker:hidden">{question}</summary><p className="mt-2 text-xs leading-relaxed text-slate-600">{answer}</p></details>)}</div></section>
    <form onSubmit={submit} className="space-y-2"><label className="block text-sm font-bold text-slate-800" htmlFor="demo-support-note">Report a prototype issue</label><textarea id="demo-support-note" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={1200} placeholder="Describe a page or map issue…" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /><button className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800"><Send size={15} />Save demo support note</button>{notice && <p role="status" className="text-xs text-slate-600">{notice}</p>}<p className="text-[11px] text-slate-500">This prototype stores the note locally and does not contact a support team.</p></form>
  </div>;
}
