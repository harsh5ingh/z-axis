import React from "react";
import {
  Camera,
  Radio,
  Compass,
  Mountain,
  Cpu,
  Layers,
  FileCheck,
} from "lucide-react";
import { Evidence } from "../types";

interface EvidenceListProps {
  evidences: Evidence[];
}

export const EvidenceList: React.FC<EvidenceListProps> = ({
  evidences,
}) => {
  if (evidences.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-center text-xs text-slate-400">
        No spatial evidence records attached.
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "DRONE_IMAGERY":
        return <Camera className="h-4 w-4 text-sky-600" />;

      case "LIDAR":
      case "POINT_CLOUD":
        return <Radio className="h-4 w-4 text-violet-600" />;

      case "GNSS_CORS":
        return <Compass className="h-4 w-4 text-emerald-600" />;

      case "DEM":
      case "DSM":
        return <Mountain className="h-4 w-4 text-amber-600" />;

      case "AI_DERIVED":
        return <Cpu className="h-4 w-4 text-rose-600" />;

      default:
        return <Layers className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-3">

      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">

        <div className="flex min-w-0 items-center gap-2">
          <FileCheck className="h-4 w-4 shrink-0 text-blue-600" />

          <h4 className="truncate text-xs font-bold uppercase tracking-wider text-slate-700">
            Attached Spatial Evidence ({evidences.length})
          </h4>
        </div>

        <span className="shrink-0 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">
          SYNTHETIC DEMO DATA
        </span>
      </div>

      {/* =====================================================
          EVIDENCE GRID
      ===================================================== */}
      <div className="grid max-h-60 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">

        {evidences.map((e) => (
          <div
            key={e.id}
            className="
              group
              flex min-w-0 flex-col justify-between
              rounded-xl
              border border-slate-200
              bg-slate-50
              p-2.5
              shadow-sm
              transition
              hover:border-blue-200
              hover:bg-white
              hover:shadow-md
            "
          >

            {/* TOP ROW */}
            <div className="flex min-w-0 items-start justify-between gap-2">

              <div className="flex min-w-0 items-center gap-2">

                {/* ICON */}
                <div
                  className="
                    flex h-9 w-9 shrink-0 items-center justify-center
                    rounded-lg
                    border border-slate-200
                    bg-white
                    shadow-sm
                  "
                >
                  {getIcon(e.source_type)}
                </div>

                {/* TITLE */}
                <div className="min-w-0">

                  <span className="block truncate text-xs font-bold leading-tight text-slate-800">
                    {e.source_type.replace(/_/g, " ")}
                  </span>

                  <span className="mt-0.5 block truncate font-mono text-[9px] uppercase tracking-wide text-slate-400">
                    {e.processing_method}
                  </span>

                </div>
              </div>

              {/* SCORE */}
              <span
                title="Prototype evidence quality score; not a survey certification"
                className="
                  shrink-0
                  rounded-md
                  border border-blue-200
                  bg-blue-50
                  px-1.5
                  py-1
                  text-[10px]
                  font-bold
                  text-blue-700
                "
              >
                {e.quality_score}%
              </span>
            </div>

            {/* SOURCE */}
            <div
              className="
                mt-2
                min-w-0
                rounded-lg
                border border-slate-200
                bg-white
                px-2
                py-1.5
              "
            >
              <p
                className="truncate text-[11px] font-medium text-slate-700"
                title={e.source_reference}
              >
                {e.source_reference}
              </p>
            </div>

            {/* FOOTER */}
            <div className="mt-2 flex min-w-0 items-center justify-between gap-2 border-t border-slate-200 pt-1.5">

              <span
                className="min-w-0 truncate text-[9px] text-slate-400"
                title={`Acquisition date: ${e.acquisition_date}`}
              >
                Date: {e.acquisition_date}
              </span>

              <span
                className="
                  shrink-0
                  text-[9px]
                  font-semibold
                  text-emerald-600
                "
                title="Stored prototype source status"
              >
                Verified Source
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};