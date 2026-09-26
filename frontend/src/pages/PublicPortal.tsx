import React, { useState } from "react";
import { useGeoVista } from "../context/GeoVISTAContext";
import { Map2D } from "../components/Map2D";
import { CityCadastreWorkspace } from "../components/CityCadastreWorkspace";
import { EvidenceList } from "../components/EvidenceList";
import { ConfidenceMeter } from "../components/ConfidenceMeter";
import { ValidationBadge } from "../components/ValidationBadge";
import { IssueReportModal } from "../components/IssueReportModal";
import { GuidedAssistant } from "../components/GuidedAssistant";
import { useUISettings } from "../context/UISettingsContext";

import {
  Search,
  MapPin,
  Building2,
  Flag,
  AlertCircle,
  Info,
  Trees,
  Layers,
  ShieldCheck,
  Database,
  Activity,
  ChevronRight,
  Map as StreetMapIcon,
} from "lucide-react";

export const PublicPortal: React.FC = () => {
  const {
    parcels,
    selectedParcel,
    selectedBuilding,
    selectedProperty,
    evidence,
    confidence,
    validation,
    candidates,
    underground,
    elevated,
    error,
    selectParcelById,
    searchCadastre,
    loading,
  } = useGeoVista();

  const [searchQuery, setSearchQuery] = useState("");
  const { city: selectedCity, setCity: setSelectedCity } = useUISettings();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(
        window.localStorage.getItem("geovista.public.recent-searches") ?? "[]",
      );
      return Array.isArray(saved)
        ? saved.filter((item): item is string => typeof item === "string").slice(0, 5)
        : [];
    } catch {
      return [];
    }
  });

  const rememberSearch = (query: string) => {
    const next = [
      query,
      ...recentSearches.filter((item) => item.toLowerCase() !== query.toLowerCase()),
    ].slice(0, 5);
    setRecentSearches(next);
    try {
      window.localStorage.setItem(
        "geovista.public.recent-searches",
        JSON.stringify(next),
      );
    } catch {
      // Search remains usable when browser storage is unavailable.
    }
  };

  const runSearch = async (value: string) => {
    const query = value.trim();
    if (!query) return;
    setSearchQuery(query);
    rememberSearch(query);
    await searchCadastre(query);
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    void runSearch(searchQuery);
  };

  return (
    <div className="min-h-screen bg-[#f6f9fc]">

      {/* =========================================================
          PORTAL HEADER
      ========================================================= */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1450px] px-5 py-5 lg:px-8">

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
                <Database className="h-4 w-4" />
                Public Property Discovery
              </div>

              <h1 className="mt-1 text-2xl font-black text-[#071d35]">
                3D Cadastral Property Portal
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Search parcels, explore 3D property volumes and review
                available spatial evidence.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <div className="mb-1.5 flex items-center gap-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <Activity className="h-3.5 w-3.5 text-emerald-600" /> 3D City
                </div>
                <div className="flex gap-1.5">
                  <button type="button" aria-pressed={selectedCity === "bhopal"} onClick={() => setSelectedCity("bhopal")} className={`rounded-lg px-3 py-2 text-left transition ${selectedCity === "bhopal" ? "bg-[#0e3550] text-white shadow-sm" : "bg-white text-slate-700 hover:bg-blue-50"}`}>
                    <span className="block text-xs font-bold">Bhopal</span><span className={`block text-[9px] ${selectedCity === "bhopal" ? "text-cyan-100" : "text-slate-500"}`}>Actual project data</span>
                  </button>
                  <button type="button" aria-pressed={selectedCity === "reference"} onClick={() => setSelectedCity("reference")} className={`rounded-lg px-3 py-2 text-left transition ${selectedCity === "reference" ? "bg-[#0e3550] text-white shadow-sm" : "bg-white text-slate-700 hover:bg-blue-50"}`}>
                    <span className="block text-xs font-bold">New York City</span><span className={`block text-[9px] ${selectedCity === "reference" ? "text-cyan-100" : "text-slate-500"}`}>Reference data</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-emerald-700">
                  <ShieldCheck className="h-4 w-4" />
                  Public Access
                </div>

                <div className="mt-1 text-sm font-bold text-emerald-800">
                  Read Only
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          MAIN CONTENT
      ========================================================= */}
      <main className="mx-auto max-w-[1450px] space-y-5 px-5 py-5 lg:px-8">

        {/* =======================================================
            INFORMATION BANNER
        ======================================================= */}
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900">

          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />

          <p className="leading-relaxed">
            <strong>SIH26011 prototype:</strong>{" "}
            Bhopal uses the project building dataset. NYC is a reference
            demonstration. Derived floors, demo identifiers and technical
            checks are labelled in the viewer; this portal does not establish
            ownership, legal rights or official ULPIN status.
          </p>
        </div>

        {/* =======================================================
            SEARCH
        ======================================================= */}
        {selectedCity === "bhopal" && <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="mb-3 flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />

            <div>
              <h2 className="text-sm font-bold text-[#071d35]">
                Find a Property Record
              </h2>

              <p className="text-xs text-slate-500">
                Search backend-linked parcel, building or proposed property records. Use the 3D viewer below to inspect the Bhopal dataset or NYC reference data.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">

              <Search className="absolute left-3.5 top-3 h-5 w-5 text-slate-400" />

              <input
                type="text"
                placeholder="Parcel code, building ID, proposed 3D ID, locality..."
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Search className="h-4 w-4" />

              {loading ? "Searching..." : "Search Cadastre"}

              {!loading && (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </form>

          {error && (
            <div role="alert" className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <p aria-live="polite" className="mt-3 text-xs text-blue-700">
              Loading or searching the property records…
            </p>
          )}

          {/* RECENT SEARCHES */}
          {recentSearches.length > 0 && (
            <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
              <span className="shrink-0 text-xs font-semibold text-slate-400">
                Recent searches:
              </span>
              {recentSearches.map((query) => (
                <button
                  key={query}
                  type="button"
                  onClick={() => void runSearch(query)}
                  className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  {query}
                </button>
              ))}
            </div>
          )}

          {/* API RECORD SHORTCUTS */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">

            <span className="shrink-0 text-xs font-semibold text-slate-400">
              Available record examples:
            </span>

            {parcels.slice(0, 6).map((parcel) => (
              <button
                key={parcel.id}
                type="button"
                onClick={() => {
                  setSearchQuery(parcel.parcel_code);
                  rememberSearch(parcel.parcel_code);
                  void selectParcelById(parcel.id);
                }}
                className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  selectedParcel?.id === parcel.id
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                {parcel.parcel_code}
                {" · "}
                {parcel.locality}
              </button>
            ))}
            {parcels.length === 0 && !loading && (
              <span className="text-xs text-slate-500">
                No API examples loaded. You can still explore the city dataset in the viewer.
              </span>
            )}
          </div>
        </section>}

        {/* =======================================================
            MAIN GRID
        ======================================================= */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">

          {/* =====================================================
              LEFT: MAP / 3D VIEW
          ===================================================== */}
          <div className="space-y-5 lg:col-span-8">

            {/* 3D VIEWER HEADER */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                    <Layers className="h-5 w-5 text-blue-600" />
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-[#071d35]">
                      3D Volumetric Cadastre
                    </h2>

                    <p className="text-xs text-slate-500">
                      {selectedCity === "bhopal" ? "Bhopal — GeoVISTA primary project dataset" : "Reference City — New York City PS demonstration"}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">Map controls and source attributes are shown in English.</p>
                  </div>
                </div>

                <span className="hidden rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700 sm:block">
                  {selectedCity === "bhopal" ? "ACTUAL PROJECT DATA" : "PROTOTYPE / REFERENCE DATA"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-px border-b border-slate-100 bg-slate-100 text-[10px] sm:grid-cols-4">
                {[
                  ["1", selectedCity === "bhopal" ? "Bhopal project dataset" : "NYC reference dataset"],
                  ["2", "Select a building or parcel"],
                  ["3", "Inspect floors and Z range"],
                  ["4", "Review prototype checks"],
                ].map(([step, label]) => (
                  <div key={step} className="flex items-center gap-2 bg-white px-3 py-2 text-slate-600">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-700">{step}</span>
                    {label}
                  </div>
                ))}
              </div>

              <CityCadastreWorkspace selectedCity={selectedCity} onCityChange={setSelectedCity} showCitySelector={false} showLegacyInspector={false} />
            </div>

            {/* CITY STREET CONTEXT */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50"><StreetMapIcon className="h-5 w-5 text-emerald-700" /></div>
                  <div><h2 className="text-sm font-bold text-[#071d35]">{selectedCity === "bhopal" ? "Bhopal street and neighborhood context" : "New York City street and borough context"}</h2><p className="text-xs text-slate-500">OpenStreetMap street basemap · separate from cadastral records</p></div>
                </div>
                <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold text-slate-600 sm:block">2D CITY CONTEXT</span>
              </div>
              <iframe
                key={selectedCity}
                title={selectedCity === "bhopal" ? "Bhopal streets and neighborhoods map" : "New York City streets and neighborhoods map"}
                src={selectedCity === "bhopal"
                  ? "https://www.openstreetmap.org/export/embed.html?bbox=77.32%2C23.16%2C77.50%2C23.32&layer=mapnik&marker=23.2596%2C77.4126"
                  : "https://www.openstreetmap.org/export/embed.html?bbox=-74.26%2C40.49%2C-73.70%2C40.92&layer=mapnik&marker=40.7128%2C-74.0060"}
                className="h-[360px] w-full border-0 bg-slate-100"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-2.5 text-[10px] text-slate-500"><span>{selectedCity === "bhopal" ? "Bhopal, Madhya Pradesh · locality and road context" : "New York City · all five boroughs, streets and neighborhoods"}</span><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="font-medium text-blue-700 hover:underline">© OpenStreetMap contributors</a></div>
            </section>

            {/* 2D MAP */}
            {selectedCity === "bhopal" && <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-[#071d35]">
                      2D Record Footprint
                    </h2>

                    <p className="text-xs text-slate-500">
                      API-linked record map; separate from the city dataset viewer above
                    </p>
                  </div>
                </div>

                <span className="hidden rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-bold text-blue-700 sm:block">
                  2D CADASTRE
                </span>
              </div>

              <Map2D
                parcel={selectedParcel}
                building={selectedBuilding}
                selectedUnit={selectedProperty}
              />
            </div>}
          </div>

          {/* =====================================================
              RIGHT: INSPECTOR
          ===================================================== */}
          <div className="space-y-5 lg:col-span-4">

            {/* ===================================================
                PROPERTY SELECTED
            =================================================== */}
            {selectedCity === "reference" ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                <span className="inline-flex rounded-md border border-amber-200 bg-white px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-amber-900">Prototype / reference data</span>
                <h2 className="mt-3 text-lg font-bold text-slate-900">New York City reference mode</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">The 3D view loads open building footprints and public tax-lot sample data for the selected Manhattan area. Use the inspector inside the map to explore building height, derived floors, vertical extent and demonstration 3D identity.</p>
                <p className="mt-3 border-t border-amber-200 pt-3 text-xs leading-relaxed text-amber-900">This is a PS workflow demonstration. It is not an official cadastral map, ownership record or government ULPIN.</p>
              </div>
            ) : selectedProperty ? (
              <>
                {/* REVIEW ALERT */}
                {selectedProperty.verification_status ===
                  "UNDER_REVIEW" && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">

                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />

                    <p className="leading-relaxed">
                      <strong>Prototype workflow status: Under review.</strong>{" "}
                      This status comes from the linked property record. It does not indicate
                      government review or legal cadastral verification.
                    </p>
                  </div>
                )}

                {/* PROPERTY CARD */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0">

                      <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider ${selectedProperty.is_synthetic ? "border-amber-200 bg-amber-50 text-amber-900" : "border-blue-100 bg-blue-50 text-blue-900"}`}>
                        <ShieldCheck className="h-3 w-3" />
                        {selectedProperty.is_synthetic ? "Synthetic demo record" : "API-linked record"}
                      </span>

                      <h2 className="mt-2 break-all font-mono text-sm font-bold text-slate-900">
                        {selectedProperty.proposed_3d_id}
                      </h2>
                      <p className="mt-1 text-[10px] text-slate-500">Proposed 3D property identifier · prototype only, not an official ULPIN</p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="mb-1 block text-[9px] text-slate-400">Prototype record status</span>
                      <ValidationBadge status={selectedProperty.verification_status} size="sm" />
                    </div>
                  </div>

                  {/* DETAILS */}
                  <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-y border-slate-100 py-4">

                    <div>
                      <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        Floor Level
                      </span>

                      <span className="mt-1 block text-sm font-bold text-slate-800">
                        Floor {selectedProperty.floor_number}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        Unit Number
                      </span>

                      <span className="mt-1 block text-sm font-bold text-slate-800">
                        {selectedProperty.unit_number}
                      </span>

                      <span className="text-[10px] text-slate-500">
                        {selectedProperty.unit_type}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        Vertical Elevation
                      </span>

                      <span className="mt-1 block font-mono text-sm font-bold text-slate-800">
                        {selectedProperty.z_min_m}m –{" "}
                        {selectedProperty.z_max_m}m
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        Footprint Area
                      </span>

                      <span className="mt-1 block text-sm font-bold text-slate-800">
                        {selectedProperty.area_sqm.toFixed(1)} m²
                      </span>
                    </div>
                  </div>

                  {/* FOOTER */}
                  <div className="flex items-center justify-between gap-3 pt-4">

                    <span className="text-xs text-slate-500">
                      Record revision:{" "}
                      <strong className="text-slate-800">
                        v{selectedProperty.revision_number}
                      </strong>
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setIsReportModalOpen(true)
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      <Flag className="h-3.5 w-3.5" />
                      Report prototype issue
                    </button>
                  </div>
                </div>

                {/* CONFIDENCE */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <ConfidenceMeter confidence={confidence} />
                  <p className="mt-2 text-[10px] leading-relaxed text-slate-500">Technical confidence for this linked record only; it does not establish ownership or legal validity.</p>
                </div>

                {/* EVIDENCE */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <EvidenceList evidences={evidence} />
                  <p className="mt-2 text-[10px] leading-relaxed text-slate-500">Check each source label and demo flag before interpreting evidence as measured or authoritative.</p>
                </div>
              </>
            ) : selectedParcel ? (
              /* =================================================
                 PARCEL INSPECTOR
              ================================================= */
              <div className="space-y-5">

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                  <div className="flex items-start justify-between gap-3">

                    <div>
                      <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider ${selectedParcel.is_synthetic ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-100 bg-emerald-50 text-emerald-900"}`}>
                        {selectedParcel.is_synthetic ? "Synthetic demo parcel" : "API-linked parcel"}
                      </span>

                      <h2 className="mt-2 font-mono text-sm font-bold text-slate-900">
                        {selectedParcel.parcel_code}
                      </h2>

                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3.5 w-3.5" />
                        {selectedParcel.locality}
                      </p>
                    </div>

                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                      {selectedParcel.land_use}
                    </span>
                  </div>

                  {/* PARCEL DETAILS */}
                  <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-y border-slate-100 py-4">

                    <div>
                      <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        District / State
                      </span>

                      <span className="mt-1 block text-sm font-semibold text-slate-800">
                        {selectedParcel.district},{" "}
                        {selectedParcel.state}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        Surface Area
                      </span>

                      <span className="mt-1 block text-sm font-semibold text-slate-800">
                        {selectedParcel.area_sqm.toLocaleString(
                          undefined,
                          {
                            maximumFractionDigits: 1,
                          },
                        )}{" "}
                        m²
                      </span>
                    </div>

                    {/* STRUCTURE CANDIDATE */}
                    {candidates.length > 0 && (
                      <div className="col-span-2 rounded-xl border border-amber-100 bg-amber-50 p-3">

                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-amber-700" />

                          <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
                            Detected Structure Candidate
                          </span>
                        </div>

                        <p className="mt-1 text-sm font-bold text-amber-900">
                          {candidates.length} Candidate
                        </p>

                        <p className="mt-1 text-xs text-amber-800">
                          {candidates[0].permanence_classification}
                          {" · "}
                          Estimated Height:{" "}
                          {candidates[0].estimated_height_m}m
                        </p>
                      </div>
                    )}

                    {/* ELEVATED */}
                    {elevated.length > 0 && (
                      <div className="col-span-2 rounded-xl border border-sky-100 bg-sky-50 p-3">

                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-sky-700" />

                          <span className="text-[10px] font-bold uppercase tracking-wide text-sky-700">
                            Elevated Transit Infrastructure
                          </span>
                        </div>

                        <p className="mt-1 text-sm font-bold text-sky-900">
                          {elevated[0].name}
                        </p>

                        <p className="mt-1 font-mono text-xs text-sky-800">
                          Z: {elevated[0].z_min_m}m –{" "}
                          {elevated[0].z_max_m}m
                        </p>
                      </div>
                    )}
                  </div>

                  {/* CONTEXT */}
                  <div className="mt-4 flex items-start gap-2">

                    {selectedParcel.area_type === "RURAL" ? (
                      <Trees className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    )}

                    <p className="text-xs leading-relaxed text-slate-500">
                      {selectedParcel.area_type === "RURAL"
                        ? "The linked record is tagged as rural. Confirm its source and survey status in the evidence before using it for decisions."
                        : "The linked record is tagged as urban. Any 3D candidate or infrastructure relationship shown here is prototype context, not a legal parcel determination."}
                    </p>
                  </div>
                </div>

                {/* CONFIDENCE */}
                {confidence && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <ConfidenceMeter confidence={confidence} />
                    <p className="mt-2 text-[10px] text-slate-500">Prototype technical confidence; not a land-title or ownership score.</p>
                  </div>
                )}

                {/* EVIDENCE */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <EvidenceList evidences={evidence} />
                  <p className="mt-2 text-[10px] text-slate-500">Evidence may be synthetic or derived. Use the displayed source and status fields as provenance hints.</p>
                </div>

                {/* UNDERGROUND */}
                {underground.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-slate-600" />

                      <h3 className="text-sm font-bold text-[#071d35]">
                        Underground Infrastructure
                      </h3>
                    </div>

                    <div className="mt-3 space-y-2">
                      {underground.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg bg-slate-50 p-3"
                        >
                          <p className="text-xs font-bold text-slate-800">
                            {item.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* =================================================
                 EMPTY STATE
              ================================================= */
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center shadow-sm">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                  <MapPin className="h-8 w-8 text-blue-500" />
                </div>

                <h3 className="mt-4 text-base font-bold text-[#071d35]">
                  Start a Property Inspection
                </h3>

                <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-500">
                  Choose a city and select a building in the 3D viewer. Use the record search above to inspect backend-linked parcel and property records; those records are shown separately from the city dataset.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* =======================================================
            GUIDED ASSISTANT
        ======================================================= */}
        <GuidedAssistant />
      </main>

      {/* =========================================================
          ISSUE REPORT
      ========================================================= */}
      {selectedProperty && (
        <IssueReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          property={selectedProperty}
        />
      )}
    </div>
  );
};
