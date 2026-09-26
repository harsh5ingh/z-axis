import { useState } from "react";

import Navbar from "../components/layout/Navbar";
import SearchPanel from "../components/search/SearchPanel";
import MapCanvas from "../components/map/MapCanvas";
import PropertyPanel from "../components/property/PropertyPanel";

import { selectedProperty } from "../data/properties";

export default function PublicPortal() {
  const [searchValue, setSearchValue] = useState(
    selectedProperty.ulpin
  );

  const [propertyOpen, setPropertyOpen] = useState(true);

  return (
    <div
      className="
        flex
        h-screen
        min-h-0
        flex-col
        overflow-hidden
        bg-slate-50
        text-slate-900
        dark:bg-slate-950
        dark:text-white
      "
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <Navbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />

      {/* =====================================================
          PORTAL WORKSPACE
      ====================================================== */}

      <div
        className={`
          grid
          min-h-0
          flex-1
          overflow-hidden

          ${
            propertyOpen
              ? "grid-cols-[290px_minmax(0,1fr)_330px]"
              : "grid-cols-[290px_minmax(0,1fr)]"
          }
        `}
      >
        {/* ===================================================
            LEFT SEARCH PANEL
        ================================================== */}

        <aside
          className="
            min-h-0
            min-w-0
            overflow-hidden
            border-r
            border-slate-200
            bg-white
            dark:border-slate-800
            dark:bg-slate-950
          "
        >
          <SearchPanel
            searchValue={searchValue}
            onSearchChange={setSearchValue}
          />
        </aside>

        {/* ===================================================
            CENTER MAP
        ================================================== */}

        <main
          className="
            relative
            min-h-0
            min-w-0
            overflow-hidden
          "
        >
          <MapCanvas />
        </main>

        {/* ===================================================
            RIGHT PROPERTY PANEL
        ================================================== */}

        {propertyOpen && (
          <aside
            className="
              min-h-0
              min-w-0
              overflow-hidden
              border-l
              border-slate-200
              bg-white
              dark:border-slate-800
              dark:bg-slate-950
            "
          >
            <PropertyPanel
              property={selectedProperty}
              onClose={() => setPropertyOpen(false)}
            />
          </aside>
        )}
      </div>
    </div>
  );
}