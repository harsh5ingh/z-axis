import React from "react";

import type {
  AuthMode,
  PortalType,
} from "./HomePage";

interface HomePageContentProps {
  onAuth?: (
    portal: PortalType,
    mode: AuthMode,
  ) => void;
}

const HomePageContent: React.FC<
  HomePageContentProps
> = ({ onAuth }) => {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm font-bold uppercase tracking-widest text-cyan-400">
            GeoVista
          </p>

          <h1 className="mt-4 text-4xl font-black">
            3D Spatial Intelligence
            <br />
            for Smarter Land Governance
          </h1>

          <p className="mt-5 max-w-2xl text-slate-300">
            A unified 3D cadastral platform for
            property visualization, ULPIN-based
            identification, spatial validation and
            evidence-driven land administration.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                onAuth?.("public", "signin")
              }
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold transition hover:bg-emerald-500"
            >
              Public Portal
            </button>

            <button
              type="button"
              onClick={() =>
                onAuth?.("officer", "signin")
              }
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold transition hover:bg-blue-500"
            >
              Officer Portal
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePageContent;