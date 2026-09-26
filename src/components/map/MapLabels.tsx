import {
  Landmark,
  MapPin,
  Trees,
} from "lucide-react";

export default function MapLabels() {
  return (
    <>
      {/* =====================================================
          UPPER LAKE
      ====================================================== */}

      <div
        className="
          absolute
          right-[28%]
          top-[14%]
          z-10
          text-center
          text-white
          drop-shadow-lg
        "
      >
        <p className="text-xs font-bold">
          Upper Lake
        </p>

        <p className="text-[10px] font-medium opacity-90">
          Bhopal
        </p>
      </div>

      {/* =====================================================
          CITY PARK
      ====================================================== */}

      <div
        className="
          absolute
          left-[9%]
          top-[48%]
          z-10
          flex
          items-center
          gap-1.5
          rounded-full
          bg-slate-950/60
          px-2.5
          py-1.5
          text-white
          shadow-lg
          backdrop-blur-md
        "
      >
        <Trees
          size={13}
          className="text-emerald-400"
        />

        <span className="text-[10px] font-semibold">
          City Park
        </span>
      </div>

      {/* =====================================================
          MAIN ROAD
      ====================================================== */}

      <div
        className="
          absolute
          bottom-[25%]
          left-[32%]
          z-10
          flex
          items-center
          gap-1.5
          rounded-lg
          bg-slate-950/70
          px-2.5
          py-1.5
          text-white
          shadow-lg
          backdrop-blur-md
        "
      >
        <Landmark
          size={13}
          className="text-slate-300"
        />

        <span className="text-[10px] font-semibold">
          Main Road
        </span>
      </div>

      {/* =====================================================
          BHOPAL LOCATION
      ====================================================== */}

      <div
        className="
          absolute
          right-[11%]
          top-[8%]
          z-20
          flex
          items-center
          gap-2
          rounded-lg
          border
          border-white/20
          bg-slate-950/75
          px-3
          py-2
          text-white
          shadow-xl
          backdrop-blur-md
        "
      >
        <MapPin
          size={15}
          fill="currentColor"
        />

        <span className="text-xs font-semibold">
          Bhopal
        </span>
      </div>
    </>
  );
}