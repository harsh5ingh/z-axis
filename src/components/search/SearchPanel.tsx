import {
  Building2,
  ChevronRight,
  Landmark,
  MapPin,
  Search,
} from "lucide-react";

import { recentSearches } from "../../data/properties";

interface SearchPanelProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
}

const iconMap = {
  unit: Building2,
  building: Building2,
  parcel: MapPin,
  landmark: Landmark,
};

const quickFilters = [
  {
    icon: MapPin,
    label: "My Location",
  },
  {
    icon: Building2,
    label: "Nearby Properties",
  },
  {
    icon: Landmark,
    label: "Popular Areas",
  },
];

export default function SearchPanel({
  searchValue,
  onSearchChange,
}: SearchPanelProps) {
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
          TABS
      ====================================================== */}

      <div
        className="
          grid
          shrink-0
          grid-cols-2
          border-b
          border-slate-200
          dark:border-slate-800
        "
      >
        <button
          type="button"
          className="
            relative
            h-12
            text-xs
            font-semibold
            text-blue-600
            dark:text-blue-400
          "
        >
          Search

          <span
            className="
              absolute
              bottom-0
              left-5
              right-5
              h-0.5
              rounded-full
              bg-blue-600
              dark:bg-blue-500
            "
          />
        </button>

        <button
          type="button"
          className="
            h-12
            text-xs
            font-medium
            text-slate-500
            transition-colors
            hover:text-slate-900
            dark:text-slate-400
            dark:hover:text-white
          "
        >
          Layers
        </button>
      </div>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div
        className="
          min-h-0
          flex-1
          overflow-y-auto
          px-4
          py-5
          [scrollbar-width:thin]
          [scrollbar-color:#cbd5e1_transparent]
          dark:[scrollbar-color:#334155_transparent]
        "
      >
        {/* ===================================================
            SEARCH PROPERTY
        ================================================== */}

        <section>
          <h2
            className="
              text-sm
              font-bold
              text-slate-900
              dark:text-white
            "
          >
            Search Property
          </h2>

          <p
            className="
              mt-2
              max-w-[245px]
              text-[11px]
              leading-[1.55]
              text-slate-500
              dark:text-slate-400
            "
          >
            Search by 3D ULPIN, address, landmark or parcel.
          </p>

          <div className="relative mt-3">
            <Search
              size={15}
              className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-slate-400
              "
            />

            <input
              value={searchValue}
              onChange={(event) =>
                onSearchChange(event.target.value)
              }
              placeholder="Search by ULPIN or address..."
              className="
                h-10
                w-full
                rounded-lg
                border
                border-slate-200
                bg-white
                pl-9
                pr-11
                text-[11px]
                text-slate-800
                outline-none
                transition-all

                placeholder:text-slate-400

                focus:border-blue-400
                focus:ring-4
                focus:ring-blue-500/10

                dark:border-slate-700
                dark:bg-slate-900
                dark:text-slate-100
                dark:placeholder:text-slate-500
                dark:focus:border-blue-500
                dark:focus:ring-blue-500/10
              "
            />

            <button
              type="button"
              aria-label="Search"
              className="
                absolute
                right-1
                top-1/2
                flex
                h-8
                w-8
                -translate-y-1/2
                items-center
                justify-center
                rounded-md
                bg-blue-600
                text-white
                shadow-sm
                transition-all
                hover:bg-blue-700
                active:scale-95
              "
            >
              <Search size={14} />
            </button>
          </div>
        </section>

        {/* ===================================================
            QUICK FILTERS
        ================================================== */}

        <section className="mt-6">
          <h3
            className="
              text-[13px]
              font-bold
              text-slate-900
              dark:text-white
            "
          >
            Quick Filters
          </h3>

          <div className="mt-2.5 flex flex-wrap gap-2">
            {quickFilters.map(
              ({ icon: Icon, label }) => (
                <button
                  key={label}
                  type="button"
                  className="
                    inline-flex
                    items-center
                    gap-1.5
                    rounded-lg
                    border
                    border-slate-200
                    bg-white
                    px-2.5
                    py-1.5
                    text-[10px]
                    font-medium
                    text-slate-600
                    transition-all

                    hover:border-blue-200
                    hover:bg-blue-50
                    hover:text-blue-700

                    dark:border-slate-700
                    dark:bg-slate-900
                    dark:text-slate-300
                    dark:hover:border-blue-500/50
                    dark:hover:bg-blue-500/10
                    dark:hover:text-blue-400
                  "
                >
                  <Icon size={12} />
                  {label}
                </button>
              ),
            )}
          </div>
        </section>

        {/* ===================================================
            RECENT SEARCHES
        ================================================== */}

        <section className="mt-7">
          <div className="flex items-center justify-between">
            <h3
              className="
                text-[13px]
                font-bold
                text-slate-900
                dark:text-white
              "
            >
              Recent Searches
            </h3>

            <button
              type="button"
              className="
                text-[10px]
                font-semibold
                text-blue-600
                transition-colors
                hover:text-blue-700
                dark:text-blue-400
              "
            >
              Clear
            </button>
          </div>

          <div className="mt-2.5 space-y-1">
            {recentSearches.map((item, index) => {
              const Icon =
                iconMap[
                  item.type as keyof typeof iconMap
                ];

              const active = index === 0;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`
                    group
                    relative
                    flex
                    w-full
                    items-center
                    gap-2.5
                    rounded-lg
                    px-2
                    py-2.5
                    text-left
                    transition-all

                    ${
                      active
                        ? `
                          bg-blue-50
                          dark:bg-blue-500/10
                        `
                        : `
                          hover:bg-slate-50
                          dark:hover:bg-slate-900
                        `
                    }
                  `}
                >
                  {/* Active indicator */}
                  {active && (
                    <span
                      className="
                        absolute
                        bottom-2
                        left-0
                        top-2
                        w-0.5
                        rounded-full
                        bg-blue-600
                      "
                    />
                  )}

                  {/* Icon */}
                  <div
                    className={`
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg

                      ${
                        active
                          ? `
                            bg-white
                            text-blue-600
                            shadow-sm
                            dark:bg-slate-900
                            dark:text-blue-400
                          `
                          : `
                            bg-slate-100
                            text-slate-500
                            dark:bg-slate-900
                            dark:text-slate-400
                          `
                      }
                    `}
                  >
                    <Icon size={14} />
                  </div>

                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <p
                      className="
                        truncate
                        text-[10px]
                        font-semibold
                        text-slate-800
                        dark:text-slate-200
                      "
                    >
                      {item.title}
                    </p>

                    <p
                      className="
                        mt-0.5
                        truncate
                        text-[9px]
                        text-slate-500
                        dark:text-slate-500
                      "
                    >
                      {item.subtitle}
                    </p>
                  </div>

                  <ChevronRight
                    size={13}
                    className="
                      shrink-0
                      text-slate-300
                      transition-colors
                      group-hover:text-blue-500
                      dark:text-slate-600
                    "
                  />
                </button>
              );
            })}
          </div>
        </section>

        {/* ===================================================
            PROMO CARD
        ================================================== */}

        <section
          className="
            relative
            mt-6
            min-h-[150px]
            overflow-hidden
            rounded-xl
            bg-slate-950
            p-4
            text-white
            shadow-lg

            dark:border
            dark:border-slate-700
            dark:bg-slate-900
          "
        >
          {/* Decorative glow */}
          <div
            className="
              pointer-events-none
              absolute
              -right-8
              -top-8
              h-24
              w-24
              rounded-full
              bg-blue-600/20
              blur-2xl
            "
          />

          <p
            className="
              relative
              text-[8px]
              font-semibold
              uppercase
              tracking-[0.16em]
              text-blue-300
            "
          >
            GeoVISTA Public Portal
          </p>

          <h3
            className="
              relative
              mt-2
              text-[16px]
              font-bold
              leading-tight
            "
          >
            Smarter Cities.
            <br />
            Stronger Communities.
          </h3>

          <p
            className="
              relative
              mt-2
              max-w-[225px]
              text-[10px]
              leading-4
              text-slate-400
            "
          >
            Explore transparent 3D land records and
            spatial information for a better connected
            tomorrow.
          </p>

          <button
            type="button"
            className="
              relative
              mt-3
              inline-flex
              items-center
              gap-1
              text-[10px]
              font-semibold
              text-white
              transition-colors
              hover:text-blue-300
            "
          >
            Learn more
            <ChevronRight size={12} />
          </button>
        </section>
      </div>
    </div>
  );
}