import {
  BadgeCheck,
  Box,
  Building2,
  ChevronRight,
  CircleX,
  Download,
  Eye,
  Layers3,
  MapPin,
  Ruler,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import type { ReactNode } from "react";

import type { Property } from "../../types/property";

interface PropertyPanelProps {
  property: Property;
  onClose?: () => void;
}

/* =========================================================
   MAIN PANEL
========================================================= */

export default function PropertyPanel({
  property,
  onClose,
}: PropertyPanelProps) {
  return (
    <div
      className="
        flex
        h-full
        min-h-0
        min-w-0
        flex-col
        bg-white
        transition-colors
        dark:bg-slate-950
      "
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <PropertyHeader
        property={property}
        onClose={onClose}
      />

      {/* =====================================================
          SCROLLABLE CONTENT
      ====================================================== */}

      <div
        className="
          min-h-0
          flex-1
          overflow-y-auto
          [scrollbar-width:thin]
          [scrollbar-color:#cbd5e1_transparent]
          dark:[scrollbar-color:#334155_transparent]
        "
      >
        {/* Hierarchy */}
        <Hierarchy property={property} />

        {/* Preview */}
        <PropertyPreview />

        {/* Tabs */}
        <PropertyTabs />

        {/* Metrics */}
        <PropertyMetrics property={property} />

        {/* Confidence */}
        <ConfidenceSection property={property} />

        {/* Why score */}
        <WhyScore />

        {/* Actions */}
        <PropertyActions />

        {/* AI */}
        <GeoVistaAssistant />
      </div>
    </div>
  );
}

/* =========================================================
   HEADER
========================================================= */

function PropertyHeader({
  property,
  onClose,
}: PropertyPanelProps) {
  return (
    <header
      className="
        shrink-0
        border-b
        border-slate-200
        px-4
        py-3.5
        dark:border-slate-800
      "
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2
            size={16}
            className="text-blue-600 dark:text-blue-400"
          />

          <h2
            className="
              text-[13px]
              font-bold
              text-slate-900
              dark:text-white
            "
          >
            Property Details
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close property panel"
          className="
            flex
            h-7
            w-7
            items-center
            justify-center
            rounded-lg
            text-slate-400
            transition-all
            hover:bg-slate-100
            hover:text-slate-700
            dark:hover:bg-slate-800
            dark:hover:text-slate-200
          "
        >
          <CircleX size={16} />
        </button>
      </div>

      <div className="mt-4 flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <h1
            className="
              break-all
              text-[13px]
              font-extrabold
              leading-5
              tracking-tight
              text-slate-900
              dark:text-white
            "
          >
            {property.ulpin}
          </h1>

          <p
            className="
              mt-0.5
              text-[10px]
              font-medium
              text-slate-500
              dark:text-slate-400
            "
          >
            {property.type}
          </p>
        </div>

        <div
          className="
            flex
            shrink-0
            items-center
            gap-1
            rounded-full
            bg-emerald-50
            px-2
            py-1
            text-[9px]
            font-bold
            text-emerald-700
            dark:bg-emerald-500/10
            dark:text-emerald-400
          "
        >
          <BadgeCheck size={11} />
          Verified
        </div>
      </div>
    </header>
  );
}

/* =========================================================
   HIERARCHY
========================================================= */

function Hierarchy({
  property,
}: {
  property: Property;
}) {
  const items = [
    ["Parcel", property.parcel],
    ["Building", property.building],
    ["Floor", property.floor],
    ["Unit", property.unit],
  ];

  return (
    <section
      className="
        grid
        grid-cols-4
        gap-1.5
        border-b
        border-slate-200
        p-3
        dark:border-slate-800
      "
    >
      {items.map(([label, value]) => (
        <HierarchyItem
          key={label}
          label={label}
          value={value}
        />
      ))}
    </section>
  );
}

function HierarchyItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        min-w-0
        rounded-lg
        border
        border-slate-200
        bg-slate-50
        px-1.5
        py-2
        text-center
        dark:border-slate-700
        dark:bg-slate-900
      "
    >
      <p
        className="
          text-[8px]
          font-medium
          text-slate-500
          dark:text-slate-400
        "
      >
        {label}
      </p>

      <p
        className="
          mt-0.5
          truncate
          text-[10px]
          font-bold
          text-slate-800
          dark:text-slate-200
        "
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   PROPERTY PREVIEW
========================================================= */

function PropertyPreview() {
  return (
    <section className="px-3 pt-3">
      <div
        className="
          relative
          h-[125px]
          overflow-hidden
          rounded-xl
          border
          border-slate-200
          bg-slate-100
          dark:border-slate-700
          dark:bg-slate-900
        "
      >
        {/* Scene */}
        <div
          className="
            absolute
            inset-0
            bg-[linear-gradient(135deg,#dbeafe,#bfdbfe_35%,#cbd5e1)]
            dark:bg-[linear-gradient(135deg,#172554,#1e3a8a_45%,#0f172a)]
          "
        />

        {/* Parcel */}
        <div
          className="
            absolute
            left-1/2
            top-1/2
            h-[78px]
            w-[105px]
            -translate-x-1/2
            -translate-y-1/2
            rotate-[-4deg]
            border
            border-blue-300
            bg-blue-400/10
          "
        />

        {/* Building */}
        <div
          className="
            absolute
            left-1/2
            top-1/2
            h-[75px]
            w-[100px]
            -translate-x-1/2
            -translate-y-1/2
            rounded-md
            border-2
            border-blue-400
            bg-blue-500/25
            shadow-[0_12px_35px_rgba(37,99,235,0.25)]
            dark:bg-blue-500/20
          "
        >
          <div className="absolute inset-x-0 top-1/3 border-t border-blue-300/70" />
          <div className="absolute inset-x-0 top-2/3 border-t border-blue-300/70" />
        </div>

        {/* 3D View */}
        <button
          type="button"
          className="
            absolute
            bottom-2
            right-2
            flex
            items-center
            gap-1.5
            rounded-lg
            bg-slate-950/90
            px-2.5
            py-1.5
            text-[9px]
            font-semibold
            text-white
            shadow-lg
            backdrop-blur-md
            transition
            hover:bg-blue-700
          "
        >
          <Eye size={11} />
          3D View
        </button>
      </div>
    </section>
  );
}

/* =========================================================
   TABS
========================================================= */

function PropertyTabs() {
  const tabs = [
    "Overview",
    "Spatial",
    "Evidence",
    "More",
  ];

  return (
    <nav
      className="
        mt-3
        flex
        border-b
        border-slate-200
        px-2
        dark:border-slate-800
      "
    >
      {tabs.map((tab, index) => (
        <button
          key={tab}
          type="button"
          className={`
            relative
            flex-1
            px-1
            py-2.5
            text-[10px]
            font-semibold
            transition-colors

            ${
              index === 0
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }
          `}
        >
          {tab}

          {index === 0 && (
            <span
              className="
                absolute
                bottom-0
                left-2
                right-2
                h-0.5
                rounded-full
                bg-blue-600
                dark:bg-blue-500
              "
            />
          )}
        </button>
      ))}
    </nav>
  );
}

/* =========================================================
   METRICS
========================================================= */

function PropertyMetrics({
  property,
}: {
  property: Property;
}) {
  return (
    <section className="grid grid-cols-2 gap-x-3 gap-y-4 p-4">
      <Metric
        icon={<Ruler size={14} />}
        label="Area"
        value={`${property.area.toLocaleString()} m²`}
      />

      <Metric
        icon={<Box size={14} />}
        label="Volume"
        value={`${property.volume.toLocaleString()} m³`}
      />

      <Metric
        icon={<Layers3 size={14} />}
        label="Elevation"
        value={`${property.elevation.min} – ${property.elevation.max} m`}
      />

      <Metric
        icon={<Building2 size={14} />}
        label="Usage"
        value={property.usage}
      />
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <div
        className="
          flex
          h-8
          w-8
          shrink-0
          items-center
          justify-center
          rounded-lg
          bg-slate-100
          text-slate-600
          dark:bg-slate-800
          dark:text-slate-300
        "
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p
          className="
            text-[9px]
            font-medium
            text-slate-500
            dark:text-slate-400
          "
        >
          {label}
        </p>

        <p
          className="
            mt-0.5
            truncate
            text-[10px]
            font-bold
            text-slate-800
            dark:text-slate-200
          "
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   CONFIDENCE
========================================================= */

function ConfidenceSection({
  property,
}: {
  property: Property;
}) {
  const metrics = [
    ["Evidence", property.confidenceBreakdown.evidence],
    ["Geometry", property.confidenceBreakdown.geometry],
    ["Position", property.confidenceBreakdown.position],
    [
      "Source Agreement",
      property.confidenceBreakdown.sourceAgreement,
    ],
    ["Validation", property.confidenceBreakdown.validation],
  ] as const;

  return (
    <section
      className="
        border-t
        border-slate-200
        px-4
        py-4
        dark:border-slate-800
      "
    >
      <div className="flex items-center gap-2">
        <ShieldCheck
          size={15}
          className="text-blue-600 dark:text-blue-400"
        />

        <h3
          className="
            text-xs
            font-bold
            text-slate-900
            dark:text-white
          "
        >
          Confidence Score
        </h3>
      </div>

      <div className="mt-4 flex items-center gap-3">
        {/* Ring */}
        <div className="relative h-[82px] w-[82px] shrink-0">
          <svg
            viewBox="0 0 120 120"
            className="h-full w-full -rotate-90"
          >
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-slate-200 dark:text-slate-800"
            />

            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke="#2563eb"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${property.confidence * 3.02} 302`}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="
                text-[15px]
                font-extrabold
                text-slate-900
                dark:text-white
              "
            >
              {property.confidence}%
            </span>

            <span
              className="
                text-[8px]
                font-medium
                text-slate-400
              "
            >
              Overall
            </span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="min-w-0 flex-1 space-y-2">
          {metrics.map(([label, value]) => (
            <div key={label}>
              <div className="mb-0.5 flex justify-between gap-2">
                <span
                  className="
                    truncate
                    text-[8px]
                    font-medium
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  {label}
                </span>

                <span
                  className="
                    text-[8px]
                    font-bold
                    text-slate-700
                    dark:text-slate-300
                  "
                >
                  {value}%
                </span>
              </div>

              <div
                className="
                  h-1
                  overflow-hidden
                  rounded-full
                  bg-slate-100
                  dark:bg-slate-800
                "
              >
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${value}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   WHY SCORE
========================================================= */

function WhyScore() {
  return (
    <button
      type="button"
      className="
        mx-3
        flex
        w-[calc(100%-1.5rem)]
        items-center
        justify-between
        rounded-lg
        border
        border-slate-200
        bg-slate-50
        px-3
        py-2.5
        text-left
        transition-all

        hover:border-blue-200
        hover:bg-blue-50

        dark:border-slate-700
        dark:bg-slate-900
        dark:hover:border-blue-500/40
        dark:hover:bg-blue-500/10
      "
    >
      <div className="min-w-0">
        <p
          className="
            text-[10px]
            font-bold
            text-slate-800
            dark:text-slate-200
          "
        >
          Why this score?
        </p>

        <p
          className="
            mt-0.5
            truncate
            text-[8px]
            text-slate-500
            dark:text-slate-400
          "
        >
          Understand how this confidence was calculated
        </p>
      </div>

      <ChevronRight
        size={14}
        className="shrink-0 text-slate-400"
      />
    </button>
  );
}

/* =========================================================
   ACTIONS
========================================================= */

function PropertyActions() {
  return (
    <section className="space-y-2 p-3">
      <button
        type="button"
        className="
          flex
          h-9
          w-full
          items-center
          justify-center
          gap-2
          rounded-lg
          bg-blue-600
          text-[10px]
          font-bold
          text-white
          shadow-sm
          transition
          hover:bg-blue-700
        "
      >
        <MapPin size={13} />
        View on Map
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="
            flex
            h-8
            items-center
            justify-center
            gap-1.5
            rounded-lg
            border
            border-slate-200
            bg-white
            text-[10px]
            font-semibold
            text-slate-600
            transition
            hover:bg-slate-50

            dark:border-slate-700
            dark:bg-slate-900
            dark:text-slate-300
            dark:hover:bg-slate-800
          "
        >
          <Share2 size={12} />
          Share
        </button>

        <button
          type="button"
          className="
            flex
            h-8
            items-center
            justify-center
            gap-1.5
            rounded-lg
            border
            border-slate-200
            bg-white
            text-[10px]
            font-semibold
            text-slate-600
            transition
            hover:bg-slate-50

            dark:border-slate-700
            dark:bg-slate-900
            dark:text-slate-300
            dark:hover:bg-slate-800
          "
        >
          <Download size={12} />
          Report
        </button>
      </div>
    </section>
  );
}

/* =========================================================
   GEOVISTA AI
========================================================= */

function GeoVistaAssistant() {
  return (
    <section
      className="
        mx-3
        mb-4
        rounded-xl
        bg-slate-950
        p-3
        text-white
        shadow-lg

        dark:border
        dark:border-slate-700
        dark:bg-slate-900
      "
    >
      <div className="flex items-center gap-2.5">
        <div
          className="
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-lg
            bg-blue-600
          "
        >
          <Sparkles size={15} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold">
            Ask GeoVISTA
          </p>

          <p className="mt-0.5 text-[8px] leading-3.5 text-slate-400">
            Ask about this property, ULPIN or spatial data.
          </p>
        </div>

        <ChevronRight
          size={14}
          className="shrink-0 text-slate-400"
        />
      </div>
    </section>
  );
}