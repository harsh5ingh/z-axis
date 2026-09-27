import React, { useEffect, useRef, useState } from "react";

import {
  UserRound,
  Landmark,
  MapPin,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
  Languages,
  Settings,
  CircleHelp,
  LogOut,
  UserCircle2,
  Menu,
  X,
  Home,
  Map,
  ShieldCheck,
} from "lucide-react";

import { AuthUser } from "../services/api";
import {
  RegionalLanguage,
  ThemePreference,
  useUISettings,
} from "../context/UISettingsContext";

/* ==========================================================================
   TYPES
========================================================================== */

interface NavbarProps {
  currentView:
    | "home"
    | "public"
    | "officer"
    | "scenarios";

  currentUser: AuthUser | null;

  onHome: () => void;
  onPublic: () => void;
  onOfficer: () => void;

  onPublicSignIn: () => void;
  onPublicSignUp: () => void;

  onOfficerSignIn: () => void;
  onOfficerSignUp: () => void;

  onProfile: () => void;
  onSettings: () => void;
  onHelp: () => void;
  onLogout: () => void;

  profileDemoVerified?: boolean;
}

/* ==========================================================================
   DATA
========================================================================== */

/*
 * Only locations that currently have an actual viewer/data mode.
 *
 * Bhopal:
 *   Actual project dataset
 *
 * New York City:
 *   Reference/demo dataset
 */

const locationOptions = [
  {
    value: "bhopal" as const,
    label: "Bhopal",
    subtitle: "Actual project data",
  },
  {
    value: "reference" as const,
    label: "New York City",
    subtitle: "Reference data",
  },
];

const languages: RegionalLanguage[] = [
  "English",
  "हिन्दी",
  "मराठी",
  "বাংলা",
  "தமிழ்",
  "తెలుగు",
  "ಕನ್ನಡ",
  "ગુજરાતી",
  "ਪੰਜਾਬੀ",
];

/* ==========================================================================
   COMPONENT
========================================================================== */

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  currentUser,

  onHome,
  onPublic,
  onOfficer,

  onPublicSignIn,
  onPublicSignUp,

  onOfficerSignIn,
  onOfficerSignUp,

  onProfile,
  onSettings,
  onHelp,
  onLogout,

  profileDemoVerified = false,
}) => {
  const {
    language: selectedLanguage,
    setLanguage,
    theme: selectedTheme,
    setTheme,
    city,
    setCity,
  } = useUISettings();

  /* ==========================================================================
     MENU STATE
  ========================================================================== */

  const [locationOpen, setLocationOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [publicOpen, setPublicOpen] = useState(false);
  const [officerOpen, setOfficerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navbarRef = useRef<HTMLDivElement>(null);

  /* ==========================================================================
     DERIVED LOCATION
  ========================================================================== */

  const currentLocation =
    locationOptions.find((location) => location.value === city) ??
    locationOptions[0];

  const locationLabel = currentLocation.label;

  /* ==========================================================================
     CLOSE MENUS
  ========================================================================== */

  const closeAllMenus = () => {
    setLocationOpen(false);
    setThemeOpen(false);
    setLanguageOpen(false);
    setPublicOpen(false);
    setOfficerOpen(false);
    setProfileOpen(false);
  };

  const closeMobile = () => {
    setMobileOpen(false);
  };

  /* ==========================================================================
     OUTSIDE CLICK
  ========================================================================== */

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        navbarRef.current &&
        !navbarRef.current.contains(event.target as Node)
      ) {
        closeAllMenus();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  /* ==========================================================================
     APPLY THEME
  ========================================================================== */

  useEffect(() => {
  const root = document.documentElement;

  const applyTheme = (isDark: boolean) => {
    // Tailwind dark: variant
    root.classList.toggle("dark", isDark);

    // Your global CSS theme system
    root.setAttribute(
      "data-color-scheme",
      isDark ? "dark" : "light",
    );
  };

  if (selectedTheme === "dark") {
    applyTheme(true);
    return;
  }

  if (selectedTheme === "light") {
    applyTheme(false);
    return;
  }

  // SYSTEM
  const mediaQuery = window.matchMedia(
    "(prefers-color-scheme: dark)",
  );

  applyTheme(mediaQuery.matches);

  const handleSystemThemeChange = (
    event: MediaQueryListEvent,
  ) => {
    applyTheme(event.matches);
  };

  mediaQuery.addEventListener(
    "change",
    handleSystemThemeChange,
  );

  return () => {
    mediaQuery.removeEventListener(
      "change",
      handleSystemThemeChange,
    );
  };
}, [selectedTheme]);

  /* ==========================================================================
     LOCATION
  ========================================================================== */

  const handleLocationChange = (
    location: "bhopal" | "reference",
  ) => {
    setCity(location);

    closeAllMenus();
    closeMobile();
  };

  /* ==========================================================================
     LANGUAGE
  ========================================================================== */

  const handleLanguageChange = (
    language: RegionalLanguage,
  ) => {
    setLanguage(language);

    closeAllMenus();
  };

  /* ==========================================================================
     THEME
  ========================================================================== */

  const handleThemeChange = (
    theme: ThemePreference,
  ) => {
    setTheme(theme);

    closeAllMenus();
  };

  /* ==========================================================================
     PORTALS
  ========================================================================== */

  const handlePublicPortal = () => {
    closeAllMenus();
    closeMobile();
    onPublic();
  };

  const handleOfficerPortal = () => {
    closeAllMenus();
    closeMobile();
    onOfficer();
  };

  const handleDemoOfficer = () => {
    closeAllMenus();
    closeMobile();
    onOfficerSignIn();
  };

  /* ==========================================================================
     MENU TOGGLE HELPERS
  ========================================================================== */

  const toggleMenu = (
    menu:
      | "location"
      | "theme"
      | "language"
      | "public"
      | "officer"
      | "profile",
  ) => {
    const states = {
      location: locationOpen,
      theme: themeOpen,
      language: languageOpen,
      public: publicOpen,
      officer: officerOpen,
      profile: profileOpen,
    };

    const next = !states[menu];

    closeAllMenus();

    switch (menu) {
      case "location":
        setLocationOpen(next);
        break;

      case "theme":
        setThemeOpen(next);
        break;

      case "language":
        setLanguageOpen(next);
        break;

      case "public":
        setPublicOpen(next);
        break;

      case "officer":
        setOfficerOpen(next);
        break;

      case "profile":
        setProfileOpen(next);
        break;
    }
  };

  /* ==========================================================================
     NAV ITEM
  ========================================================================== */

  const navItemClass = (
    active = false,
  ) =>
    [
      "relative",
      "flex",
      "h-full",
      "items-center",
      "px-2",
      "text-[14px]",
      "font-semibold",
      "transition-colors",
      active
        ? "text-blue-600 dark:text-blue-400"
        : "text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400",
    ].join(" ");

  /* ==========================================================================
     COMMON DROPDOWN
  ========================================================================== */

  const dropdownClass =
    "absolute right-0 top-[calc(100%+8px)] z-[100] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-[#101d30] dark:shadow-2xl";

  const dropdownHeadingClass =
    "px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500";

  const dropdownItemClass =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:!bg-slate-50 hover:!text-slate-700 dark:text-slate-200 dark:hover:!bg-slate-800 dark:hover:!text-slate-200";

  return (
    <header
      ref={navbarRef}
      className="
        sticky top-0 z-[90]
        border-b border-slate-200 dark:border-slate-700
        bg-white/95 dark:bg-[#0b1728]/95
        text-slate-900 dark:text-white
        shadow-[0_1px_10px_rgba(15,23,42,0.05)]
        dark:shadow-[0_1px_12px_rgba(0,0,0,0.35)]
        backdrop-blur-xl
      "
    >
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">

        {/* ==================================================================
            DESKTOP NAVBAR
        ================================================================== */}

        <div className="hidden h-[74px] items-center lg:flex">

          {/* ================================================================
              LOGO
          ================================================================ */}

          <button
            type="button"
            onClick={onHome}
            className="flex shrink-0 items-center gap-3"
            aria-label="GeoVista Home"
          >
            <div className="relative h-10 w-10">
              <div className="absolute bottom-0 left-1 h-4 w-7 rounded-sm bg-blue-700" />
              <div className="absolute bottom-2 left-1 h-4 w-7 rotate-45 rounded-sm bg-blue-600" />
              <div className="absolute bottom-4 left-1 h-4 w-7 -rotate-45 rounded-sm bg-emerald-500" />
              <div className="absolute left-2 top-0 h-3 w-6 rounded-sm bg-emerald-400" />
            </div>

            <div className="text-left leading-none">
              <div className="text-[24px] font-black tracking-tight text-[#10284b] dark:text-white">
                Geo
                <span className="text-blue-600 dark:text-blue-400">
                  Vista
                </span>
              </div>

              <div className="mt-1 text-[8px] font-bold tracking-[0.22em] text-slate-500 dark:text-slate-400">
                3D ULPIN PLATFORM
              </div>
            </div>
          </button>

          {/* ================================================================
              MAIN NAVIGATION
          ================================================================ */}

          <nav className="ml-10 flex h-full items-center gap-6">
            <button
              type="button"
              onClick={onHome}
              className={navItemClass(currentView === "home")}
            >
              Home

              {currentView === "home" && (
                <span className="absolute bottom-0 left-2 right-2 h-[3px] rounded-full bg-blue-600" />
              )}
            </button>

            <a
              href="#about"
              className={navItemClass()}
            >
              About
            </a>

            <a
              href="#features"
              className={navItemClass()}
            >
              Features
            </a>

            <a
              href="#use-cases"
              className={navItemClass()}
            >
              Use Cases
            </a>

            <a
              href="#contact"
              className={navItemClass()}
            >
              Contact
            </a>
          </nav>

          {/* ================================================================
              RIGHT CONTROLS
          ================================================================ */}

          <div className="ml-auto flex items-center gap-2">

            {/* ============================================================
                LOCATION
            ============================================================ */}

            <div className="relative">
              <button
                type="button"
                onClick={() => toggleMenu("location")}
                className="
                  flex h-10 items-center gap-2 rounded-lg
                  border border-slate-200 dark:border-slate-700
                  bg-white dark:bg-[#101d30]
                  px-3 text-sm font-semibold
                  text-slate-700 dark:text-slate-200
                  transition
                  hover:border-blue-200 hover:bg-slate-50
                  dark:hover:border-blue-500/40 dark:hover:bg-slate-800
                "
              >
                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />

                <span className="max-w-[110px] truncate">
                  {locationLabel}
                </span>

                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 transition ${
                    locationOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {locationOpen && (
                <div
                  className={`${dropdownClass} w-72`}
                >
                  <div className={dropdownHeadingClass}>
                    Select Location
                  </div>

                  <div className="space-y-1">
                    {locationOptions.map((location) => {
                      const active =
                        city === location.value;

                      return (
                        <button
                          key={location.value}
                          type="button"
                          onClick={() =>
                            handleLocationChange(
                              location.value,
                            )
                          }
                          className={`
                            flex w-full items-center justify-between
                            rounded-lg px-3 py-2.5 text-left
                            transition
                            ${
                              active
                                ? "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
                                : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                            }
                          `}
                        >
                          <span>
                            <span className="block text-sm font-semibold">
                              {location.label}
                            </span>

                            <span
                              className={`block text-[10px] ${
                                active
                                  ? "text-blue-500 dark:text-blue-300"
                                  : "text-slate-400 dark:text-slate-500"
                              }`}
                            >
                              {location.subtitle}
                            </span>
                          </span>

                          {active && (
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ============================================================
                THEME
            ============================================================ */}

            <div className="relative">
              <button
                type="button"
                onClick={() => toggleMenu("theme")}
                className="
                  flex h-10 items-center gap-1 rounded-lg
                  border border-slate-200 dark:border-slate-700
                  bg-white dark:bg-[#101d30]
                  px-2.5
                  text-slate-700 dark:text-slate-200
                  transition
                  hover:border-blue-200 hover:bg-slate-50
                  dark:hover:border-blue-500/40 dark:hover:bg-slate-800
                "
                aria-label="Theme"
              >
                {selectedTheme === "dark" ? (
                  <Moon className="h-4 w-4" />
                ) : selectedTheme === "light" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Monitor className="h-4 w-4" />
                )}

                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {themeOpen && (
                <div
                  className={`${dropdownClass} w-44`}
                >
                  <div className={dropdownHeadingClass}>
                    Appearance
                  </div>

                  {[
                    {
                      value: "dark" as const,
                      label: "Dark",
                      icon: Moon,
                    },
                    {
                      value: "system" as const,
                      label: "System",
                      icon: Monitor,
                    },
                    {
                      value: "light" as const,
                      label: "Light",
                      icon: Sun,
                    },
                  ].map(
                    ({
                      value,
                      label,
                      icon: Icon,
                    }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          handleThemeChange(value)
                        }
                        className={`
                          ${dropdownItemClass}
                          ${
                            selectedTheme === value
                              ? "bg-blue-50 font-semibold text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
                              : ""
                          }
                        `}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>

            {/* ============================================================
                LANGUAGE
            ============================================================ */}

            <div className="relative">
              <button
                type="button"
                onClick={() => toggleMenu("language")}
                className="
                  flex h-10 items-center gap-2 rounded-lg
                  border border-slate-200 dark:border-slate-700
                  bg-white dark:bg-[#101d30]
                  px-3 text-sm font-semibold
                  text-slate-700 dark:text-slate-200
                  transition
                  hover:border-emerald-200 hover:bg-slate-50
                  dark:hover:border-emerald-500/40 dark:hover:bg-slate-800
                "
              >
                <Languages className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />

                <span>
                  {selectedLanguage === "English"
                    ? "EN"
                    : selectedLanguage}
                </span>

                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {languageOpen && (
                <div
                  className={`${dropdownClass} w-48`}
                >
                  <div className={dropdownHeadingClass}>
                    Regional Language
                  </div>

                  {languages.map((language) => {
                    const active =
                      selectedLanguage === language;

                    return (
                      <button
                        key={language}
                        type="button"
                        onClick={() =>
                          handleLanguageChange(language)
                        }
                        className={`
                          ${dropdownItemClass}
                          ${
                            active
                              ? "bg-emerald-50 font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                              : ""
                          }
                        `}
                      >
                        {language}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ============================================================
                PUBLIC PORTAL
            ============================================================ */}

            <div className="relative">
              <button
                type="button"
                onClick={() => toggleMenu("public")}
                className="
                  flex h-10 items-center gap-2 rounded-lg
                  border border-slate-200 dark:border-slate-700
                  bg-white dark:bg-[#101d30]
                  px-3.5 text-sm font-semibold
                  text-slate-700 dark:text-slate-200
                  transition
                  hover:border-emerald-200 hover:bg-emerald-50
                  dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/10
                "
              >
                <UserRound className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />

                Public

                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 transition ${
                    publicOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {publicOpen && (
                <div
                  className={`${dropdownClass} w-56`}
                >
                  {currentUser?.role === "public" ? (
                    <>
                      <button
                        type="button"
                        onClick={handlePublicPortal}
                        className={`${dropdownItemClass} hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400`}
                      >
                        <Map className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        Open Public Portal
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          closeAllMenus();
                          onLogout();
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          closeAllMenus();
                          onPublicSignIn();
                        }}
                        className={`${dropdownItemClass} hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400`}
                      >
                        <UserRound className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        Sign In
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          closeAllMenus();
                          onPublicSignUp();
                        }}
                        className={`${dropdownItemClass} hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400`}
                      >
                        <UserCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        Create Account
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ============================================================
                OFFICER PORTAL
            ============================================================ */}

            <div className="relative">
              <button
                type="button"
                onClick={() => toggleMenu("officer")}
                className="
                  flex h-10 items-center gap-2 rounded-lg
                  border border-slate-200 dark:border-slate-700
                  bg-white dark:bg-[#101d30]
                  px-3.5 text-sm font-semibold
                  text-slate-700 dark:text-slate-200
                  transition
                  hover:border-blue-200 hover:bg-blue-50
                  dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10
                "
              >
                <Landmark className="h-4 w-4 text-blue-600 dark:text-blue-400" />

                Officer

                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 transition ${
                    officerOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {officerOpen && (
                <div
                  className={`${dropdownClass} w-60`}
                >
                  {currentUser?.role === "officer" ? (
                    <>
                      <button
                        type="button"
                        onClick={handleOfficerPortal}
                        className={`${dropdownItemClass} hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-500/10 dark:hover:text-blue-400`}
                      >
                        <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        Open Officer Portal
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          closeAllMenus();
                          onLogout();
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          closeAllMenus();
                          onOfficerSignIn();
                        }}
                        className={`${dropdownItemClass} hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-500/10 dark:hover:text-blue-400`}
                      >
                        <Landmark className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        Sign In
                      </button>

                      <button
                        type="button"
                        onClick={handleDemoOfficer}
                        className="
                          flex w-full items-center gap-3
                          rounded-lg bg-blue-50 px-3 py-2.5
                          text-left text-sm font-semibold
                          text-blue-700
                          transition hover:bg-blue-100
                          dark:bg-blue-500/10 dark:text-blue-400
                          dark:hover:bg-blue-500/20
                        "
                      >
                        <span className="flex h-5 w-5 items-center justify-center">
                          🎯
                        </span>

                        <span className="flex flex-col">
                          <span>
                            Try Demo Officer
                          </span>

                          <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400">
                            SIH evaluation • No registration
                          </span>
                        </span>
                      </button>

                      <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

                      <button
                        type="button"
                        onClick={() => {
                          closeAllMenus();
                          onOfficerSignUp();
                        }}
                        className={`${dropdownItemClass} hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-500/10 dark:hover:text-blue-400`}
                      >
                        <UserCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        Create Account
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ============================================================
                PROFILE
            ============================================================ */}

            {currentUser && (
              <div className="relative ml-1">
                <button
                  type="button"
                  onClick={() => toggleMenu("profile")}
                  className="
                    flex h-10 w-10 items-center justify-center
                    rounded-full border-2
                    border-blue-100 dark:border-blue-500/30
                    bg-blue-50 dark:bg-blue-500/10
                    text-blue-600 dark:text-blue-400
                    transition
                    hover:border-blue-200 hover:bg-blue-100
                    dark:hover:border-blue-500/50 dark:hover:bg-blue-500/20
                  "
                  aria-label="Account menu"
                >
                  <UserRound className="h-5 w-5" />
                </button>

                {profileOpen && (
                  <div
                    className={`${dropdownClass} w-60`}
                  >
                    <div className="mb-1 border-b border-slate-100 px-3 py-3 dark:border-slate-700">
                      <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                        {currentUser.name}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                        {currentUser.email}
                      </p>

                      <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                        {currentUser.role}
                        {profileDemoVerified &&
                        currentUser.role === "public"
                          ? " · DEMO VERIFIED"
                          : ""}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        closeAllMenus();
                        onProfile();
                      }}
                      className={dropdownItemClass}
                    >
                      <UserCircle2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      Profile
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        closeAllMenus();
                        onSettings();
                      }}
                      className={dropdownItemClass}
                    >
                      <Settings className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      Settings
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        closeAllMenus();
                        onHelp();
                      }}
                      className={dropdownItemClass}
                    >
                      <CircleHelp className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      Help & Support
                    </button>

                    <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

                    <button
                      type="button"
                      onClick={() => {
                        closeAllMenus();
                        onLogout();
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ==================================================================
            MOBILE NAVBAR
        ================================================================== */}

        <div className="flex h-[68px] items-center justify-between lg:hidden">

          {/* MOBILE LOGO */}

          <button
            type="button"
            onClick={() => {
              onHome();
              closeMobile();
            }}
            className="flex items-center gap-2.5"
          >
            <div className="relative h-9 w-9">
              <div className="absolute bottom-0 left-1 h-3.5 w-6 rounded-sm bg-blue-700" />
              <div className="absolute bottom-1.5 left-1 h-3.5 w-6 rotate-45 rounded-sm bg-blue-600" />
              <div className="absolute bottom-3 left-1 h-3.5 w-6 -rotate-45 rounded-sm bg-emerald-500" />
              <div className="absolute left-1.5 top-0 h-2.5 w-5 rounded-sm bg-emerald-400" />
            </div>

            <div className="text-left leading-none">
              <div className="text-[21px] font-black tracking-tight text-[#10284b] dark:text-white">
                Geo
                <span className="text-blue-600 dark:text-blue-400">
                  Vista
                </span>
              </div>

              <div className="mt-1 text-[7px] font-bold tracking-[0.2em] text-slate-500 dark:text-slate-400">
                3D ULPIN PLATFORM
              </div>
            </div>
          </button>

          {/* MOBILE ACTIONS */}

          <div className="flex items-center gap-2">
            {currentUser && (
              <button
                type="button"
                onClick={() => toggleMenu("profile")}
                className="
                  flex h-10 w-10 items-center justify-center
                  rounded-full border-2
                  border-blue-100 dark:border-blue-500/30
                  bg-blue-50 dark:bg-blue-500/10
                  text-blue-600 dark:text-blue-400
                "
              >
                <UserRound className="h-5 w-5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="
                flex h-10 w-10 items-center justify-center
                rounded-xl
                border border-slate-200 dark:border-slate-700
                bg-white dark:bg-[#101d30]
                text-slate-700 dark:text-slate-200
              "
              aria-label="Menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* ==================================================================
            MOBILE MENU
        ================================================================== */}

        {mobileOpen && (
          <div className="border-t border-slate-100 py-4 dark:border-slate-700 lg:hidden">

            <div className="space-y-1">

              <button
                type="button"
                onClick={() => {
                  onHome();
                  closeMobile();
                }}
                className={`
                  flex w-full items-center gap-3 rounded-lg
                  px-3 py-3 text-left text-sm font-semibold
                  ${
                    currentView === "home"
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                      : "text-slate-700 dark:text-slate-200"
                  }
                `}
              >
                <Home className="h-4 w-4" />
                Home
              </button>

              {[
                {
                  href: "#about",
                  label: "About",
                  icon: Map,
                },
                {
                  href: "#features",
                  label: "Features",
                  icon: Map,
                },
                {
                  href: "#use-cases",
                  label: "Use Cases",
                  icon: MapPin,
                },
                {
                  href: "#contact",
                  label: "Contact",
                  icon: CircleHelp,
                },
              ].map(
                ({
                  href,
                  label,
                  icon: Icon,
                }) => (
                  <a
                    key={href}
                    href={href}
                    onClick={closeMobile}
                    className="
                      flex items-center gap-3 rounded-lg
                      px-3 py-3 text-sm font-semibold
                      text-slate-700
                      dark:text-slate-200
                    "
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </a>
                ),
              )}
            </div>

            <div className="my-3 border-t border-slate-100 dark:border-slate-700" />

            {/* ==============================================================
                MOBILE PUBLIC
            ============================================================== */}

            <div className="space-y-1">
              <button
                type="button"
                onClick={handlePublicPortal}
                className="
                  flex w-full items-center gap-3 rounded-lg
                  px-3 py-3 text-left text-sm font-semibold
                  text-slate-700
                  hover:bg-emerald-50
                  dark:text-slate-200
                  dark:hover:bg-emerald-500/10
                "
              >
                <UserRound className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />

                {currentUser?.role === "public"
                  ? "Open Public Portal"
                  : "Public Portal"}
              </button>

              {!currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    closeMobile();
                    onPublicSignUp();
                  }}
                  className="
                    ml-7 flex w-[calc(100%-1.75rem)]
                    items-center rounded-lg px-3 py-2
                    text-left text-xs font-semibold
                    text-emerald-700
                    dark:text-emerald-400
                  "
                >
                  Create Public Account
                </button>
              )}
            </div>

            {/* ==============================================================
                MOBILE OFFICER
            ============================================================== */}

            <div className="mt-1 space-y-1">
              <button
                type="button"
                onClick={handleOfficerPortal}
                className="
                  flex w-full items-center gap-3 rounded-lg
                  px-3 py-3 text-left text-sm font-semibold
                  text-slate-700
                  hover:bg-blue-50
                  dark:text-slate-200
                  dark:hover:bg-blue-500/10
                "
              >
                <Landmark className="h-4 w-4 text-blue-600 dark:text-blue-400" />

                {currentUser?.role === "officer"
                  ? "Open Officer Portal"
                  : "Officer Portal"}
              </button>

              {!currentUser && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobile();
                      onOfficerSignIn();
                    }}
                    className="
                      ml-7 flex w-[calc(100%-1.75rem)]
                      items-center rounded-lg px-3 py-2
                      text-left text-xs font-semibold
                      text-blue-700
                      dark:text-blue-400
                    "
                  >
                    Sign In
                  </button>

                  <button
                    type="button"
                    onClick={handleDemoOfficer}
                    className="
                      ml-7 flex w-[calc(100%-1.75rem)]
                      items-center gap-2 rounded-lg
                      bg-blue-50 px-3 py-2.5
                      text-left text-xs font-bold
                      text-blue-700
                      dark:bg-blue-500/10
                      dark:text-blue-400
                    "
                  >
                    🎯
                    <span>Try Demo Officer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      closeMobile();
                      onOfficerSignUp();
                    }}
                    className="
                      ml-7 flex w-[calc(100%-1.75rem)]
                      items-center rounded-lg px-3 py-2
                      text-left text-xs font-semibold
                      text-blue-700
                      dark:text-blue-400
                    "
                  >
                    Create Officer Account
                  </button>
                </>
              )}
            </div>

            {/* ==============================================================
                MOBILE SETTINGS
            ============================================================== */}

            <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-700">

              <div className="grid grid-cols-2 gap-2">

                {/* THEME */}

                <button
                  type="button"
                  onClick={() => {
                    const order: ThemePreference[] = [
                      "system",
                      "light",
                      "dark",
                    ];

                    const next =
                      order[
                        (order.indexOf(selectedTheme) + 1) %
                          order.length
                      ];

                    handleThemeChange(next);
                  }}
                  className="
                    flex items-center justify-center gap-2
                    rounded-lg
                    border border-slate-200 dark:border-slate-700
                    bg-white dark:bg-[#101d30]
                    p-2.5 text-xs font-semibold
                    text-slate-600 dark:text-slate-300
                  "
                >
                  {selectedTheme === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : selectedTheme === "light" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Monitor className="h-4 w-4" />
                  )}

                  {selectedTheme === "system"
                    ? "System"
                    : selectedTheme === "dark"
                      ? "Dark"
                      : "Light"}
                </button>

                {/* LOCATION */}

                <button
                  type="button"
                  onClick={() =>
                    handleLocationChange(
                      city === "reference"
                        ? "bhopal"
                        : "reference",
                    )
                  }
                  className="
                    flex items-center justify-center gap-2
                    rounded-lg
                    border border-slate-200 dark:border-slate-700
                    bg-white dark:bg-[#101d30]
                    p-2.5 text-xs font-semibold
                    text-slate-600 dark:text-slate-300
                  "
                >
                  <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />

                  {locationLabel}
                </button>

                {/* LANGUAGE */}

                <label
                  className="
                    col-span-2 flex items-center gap-2
                    rounded-lg
                    border border-slate-200 dark:border-slate-700
                    bg-white dark:bg-[#101d30]
                    px-3 py-2
                    text-xs font-semibold
                    text-slate-600 dark:text-slate-300
                  "
                >
                  <Languages className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />

                  <span className="shrink-0">
                    Language
                  </span>

                  <select
                    aria-label="Regional language"
                    value={selectedLanguage}
                    onChange={(event) =>
                      handleLanguageChange(
                        event.target.value as RegionalLanguage,
                      )
                    }
                    className="
                      min-w-0 flex-1
                      border-0 bg-transparent
                      py-1 text-right text-xs
                      font-semibold
                      text-slate-700
                      outline-none
                      dark:text-slate-200
                    "
                  >
                    {languages.map((language) => (
                      <option
                        key={language}
                        value={language}
                        className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white"
                      >
                        {language}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;