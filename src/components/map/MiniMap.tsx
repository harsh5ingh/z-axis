import {
  Expand,
  MapPin,
} from "lucide-react";

export default function MiniMap() {
  return (
    <div
      className="
        absolute
        bottom-5
        left-5
        z-20
        h-[150px]
        w-[190px]
        overflow-hidden
        rounded-xl
        border
        border-white/80
        bg-white
        shadow-xl
        dark:border-slate-700
        dark:bg-slate-900
      "
    >
      {/* Header */}
      <div
        className="
          absolute
          left-0
          right-0
          top-0
          z-10
          flex
          items-center
          justify-between
          bg-white/90
          px-3
          py-2
          backdrop-blur-md
          dark:bg-slate-900/90
        "
      >
        <span
          className="
            text-[11px]
            font-bold
            text-slate-800
            dark:text-white
          "
        >
          2D Map View
        </span>

        <button
          type="button"
          className="
            flex
            h-6
            w-6
            items-center
            justify-center
            rounded-md
            text-slate-500
            hover:bg-slate-100
            dark:text-slate-300
            dark:hover:bg-slate-800
          "
        >
          <Expand size={13} />
        </button>
      </div>

      {/* Map */}
      <div
        className="
          absolute
          inset-0
          bg-[#e8e6df]
          dark:bg-slate-800
        "
      >
        {/* Streets */}
        <div
          className="
            absolute
            left-[-20px]
            top-[65px]
            h-[2px]
            w-[240px]
            rotate-[12deg]
            bg-white
            shadow-[0_0_0_1px_#d0cec7]
          "
        />

        <div
          className="
            absolute
            left-[20px]
            top-[-20px]
            h-[220px]
            w-[2px]
            rotate-[32deg]
            bg-white
            shadow-[0_0_0_1px_#d0cec7]
          "
        />

        <div
          className="
            absolute
            left-[-10px]
            top-[105px]
            h-[2px]
            w-[240px]
            rotate-[-17deg]
            bg-white
            shadow-[0_0_0_1px_#d0cec7]
          "
        />

        <div
          className="
            absolute
            left-[120px]
            top-[-20px]
            h-[220px]
            w-[2px]
            rotate-[55deg]
            bg-white
            shadow-[0_0_0_1px_#d0cec7]
          "
        />

        {/* Blocks */}
        <div className="absolute left-3 top-12 h-7 w-9 bg-[#d7d4cc]" />
        <div className="absolute left-14 top-10 h-9 w-12 bg-[#d3d0c8]" />
        <div className="absolute right-4 top-16 h-8 w-10 bg-[#d5d2ca]" />
        <div className="absolute left-8 bottom-5 h-8 w-12 bg-[#d1cec6]" />
        <div className="absolute right-8 bottom-4 h-9 w-9 bg-[#d4d1c9]" />

        {/* Selected parcel */}
        <div
          className="
            absolute
            left-[76px]
            top-[65px]
            h-10
            w-12
            rotate-[8deg]
            border-2
            border-blue-500
            bg-blue-500/30
          "
        />

        {/* Location */}
        <div
          className="
            absolute
            left-[92px]
            top-[78px]
            flex
            -translate-x-1/2
            -translate-y-1/2
            items-center
            justify-center
          "
        >
          <span
            className="
              absolute
              h-7
              w-7
              animate-pulse
              rounded-full
              bg-blue-500/20
            "
          />

          <MapPin
            size={19}
            fill="currentColor"
            className="
              relative
              text-blue-600
              drop-shadow-md
            "
          />
        </div>
      </div>
    </div>
  );
}