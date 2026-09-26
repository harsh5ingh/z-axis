import {
  Globe2,
  Moon,
  Search,
  Sun,
  UserCircle,
} from "lucide-react";

import { useTheme } from "../common/ThemeProvider";

interface NavbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export default function Navbar({
  searchValue,
  onSearchChange,
}: NavbarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="relative z-50 h-[76px] shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-colors dark:border-slate-700/70 dark:bg-slate-950/95">
      <div className="mx-auto flex h-full max-w-[1900px] items-center gap-6 px-5">

        {/* Brand */}
        <div className="flex min-w-[235px] items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm dark:bg-blue-600">
            <span className="text-xl font-bold">
              G
            </span>
          </div>

          <div>
            <h1 className="text-[22px] font-extrabold leading-none tracking-tight text-slate-950 dark:text-white">
              GeoVISTA
            </h1>

            <p className="mt-1 text-[11px] font-medium tracking-wide text-slate-500 dark:text-slate-400">
              3D ULPIN | People to Place
            </p>
          </div>

        </div>

        {/* Navigation */}
        <nav className="hidden items-center gap-7 xl:flex">

          <a
            href="#explore"
            className="text-sm font-semibold text-blue-600 dark:text-blue-400"
          >
            Explore
          </a>

          {[
            "About",
            "How it Works",
            "Use Cases",
            "Resources",
          ].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replaceAll(" ", "-")}`}
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
            >
              {item}
            </a>
          ))}

        </nav>

        {/* Search */}
        <div className="ml-auto hidden max-w-[480px] flex-1 lg:block">
          <div className="relative">

            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={searchValue}
              onChange={(event) =>
                onSearchChange(event.target.value)
              }
              placeholder="Search by 3D ULPIN, address, landmark..."
              className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-900 dark:focus:ring-blue-500/10"
            />

          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={
              theme === "light"
                ? "Switch to dark mode"
                : "Switch to light mode"
            }
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {theme === "light" ? (
              <Moon size={17} />
            ) : (
              <Sun size={17} />
            )}
          </button>

          {/* Language */}
          <button className="hidden items-center gap-2 rounded-full px-2 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:flex">
            <Globe2 size={17} />
            EN
          </button>

          {/* Portal */}
          <button className="hidden h-11 items-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 sm:flex">
            <UserCircle size={17} />
            Public Portal
          </button>

        </div>
      </div>
    </header>
  );
}