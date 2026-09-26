import {
  ArrowDownToLine,
  Building2,
} from "lucide-react";

export type FloorId =
  | "roof"
  | "floor-4"
  | "floor-3"
  | "floor-2"
  | "floor-1"
  | "ground"
  | "basement";

interface FloorSelectorProps {
  selectedFloor: FloorId;
  onFloorChange: (floor: FloorId) => void;
}

const FLOORS: {
  id: FloorId;
  label: string;
  short: string;
}[] = [
  {
    id: "roof",
    label: "Roof",
    short: "R",
  },
  {
    id: "floor-4",
    label: "Floor 4",
    short: "F4",
  },
  {
    id: "floor-3",
    label: "Floor 3",
    short: "F3",
  },
  {
    id: "floor-2",
    label: "Floor 2",
    short: "F2",
  },
  {
    id: "floor-1",
    label: "Floor 1",
    short: "F1",
  },
  {
    id: "ground",
    label: "Ground",
    short: "G",
  },
  {
    id: "basement",
    label: "Basement",
    short: "B1",
  },
];

export default function FloorSelector({
  selectedFloor,
  onFloorChange,
}: FloorSelectorProps) {
  return (
    <div
      className="
        absolute
        left-[calc(48%+90px)]
        top-[31%]
        z-30
        flex
        flex-col
        gap-1
      "
    >
      {FLOORS.map((floor) => {
        const active = selectedFloor === floor.id;

        return (
          <button
            key={floor.id}
            type="button"
            onClick={() => onFloorChange(floor.id)}
            className={`
              flex
              h-7
              min-w-[72px]
              items-center
              justify-between
              gap-2
              rounded-md
              border
              px-2
              text-[10px]
              font-semibold
              shadow-md
              backdrop-blur-md
              transition-all

              ${
                active
                  ? `
                    border-blue-400
                    bg-blue-600
                    text-white
                    shadow-blue-500/30
                  `
                  : `
                    border-white/70
                    bg-slate-950/75
                    text-white
                    hover:bg-slate-800

                    dark:border-slate-600
                    dark:bg-slate-900/90
                  `
              }
            `}
          >
            <span className="flex items-center gap-1.5">
              {floor.id === "ground" ? (
                <Building2 size={11} />
              ) : floor.id === "basement" ? (
                <ArrowDownToLine size={11} />
              ) : (
                <span className="text-[8px] opacity-70">
                  {floor.short}
                </span>
              )}

              {floor.label}
            </span>

            {active && (
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            )}
          </button>
        );
      })}
    </div>
  );
}