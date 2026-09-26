type GeoGeometry =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

type GeoFeature = {
  type: "Feature";
  properties?: Record<string, unknown>;
  geometry: GeoGeometry;
};

type WorkerRequest = {
  url: string;
  maxFeatures: number;
  initialRadiusMeters: number;
};

type WorkerResponse =
  | { kind: "progress"; message: string }
  | {
      kind: "success";
      features: GeoFeature[];
      totalFeatures: number;
      center: { lat: number; lon: number };
      radiusMeters: number;
    }
  | { kind: "error"; message: string };

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage: (message: WorkerResponse) => void;
};

function getCentroid(feature: GeoFeature) {
  const polygon =
    feature.geometry.type === "Polygon"
      ? feature.geometry.coordinates
      : feature.geometry.coordinates[0];
  const ring = polygon?.[0];
  if (!ring?.length) return null;

  let lon = 0;
  let lat = 0;
  let count = 0;
  for (const coordinate of ring) {
    const x = Number(coordinate[0]);
    const y = Number(coordinate[1]);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      lon += x;
      lat += y;
      count += 1;
    }
  }
  return count ? { lon: lon / count, lat: lat / count } : null;
}

function distanceMeters(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
) {
  const latScale = 111_320;
  const lonScale = latScale * Math.cos((b.lat * Math.PI) / 180);
  return Math.hypot((a.lon - b.lon) * lonScale, (a.lat - b.lat) * latScale);
}

workerScope.onmessage = async ({ data }) => {
  try {
    workerScope.postMessage({
      kind: "progress",
      message: "Downloading the Bhopal building dataset…",
    });

    const response = await fetch(data.url);
    if (!response.ok) {
      throw new Error(`Bhopal dataset request failed (${response.status})`);
    }

    workerScope.postMessage({
      kind: "progress",
      message: "Reading GeoJSON in the background…",
    });
    const collection = (await response.json()) as {
      features?: unknown[];
    };
    const allFeatures = (collection.features ?? []).filter(
      (value): value is GeoFeature => {
        if (!value || typeof value !== "object") return false;
        const candidate = value as GeoFeature;
        return (
          candidate.type === "Feature" &&
          !!candidate.geometry &&
          (candidate.geometry.type === "Polygon" ||
            candidate.geometry.type === "MultiPolygon")
        );
      },
    );

    workerScope.postMessage({
      kind: "progress",
      message: "Finding a local 3D inspection area…",
    });

    const candidates = allFeatures
      .map((feature) => ({ feature, center: getCentroid(feature) }))
      .filter(
        (
          row,
        ): row is {
          feature: GeoFeature;
          center: { lat: number; lon: number };
        } => row.center !== null,
      );

    if (!candidates.length) {
      throw new Error("The Bhopal dataset has no polygon building features.");
    }

    const bounds = candidates.reduce(
      (value, row) => ({
        minLon: Math.min(value.minLon, row.center.lon),
        maxLon: Math.max(value.maxLon, row.center.lon),
        minLat: Math.min(value.minLat, row.center.lat),
        maxLat: Math.max(value.maxLat, row.center.lat),
      }),
      {
        minLon: Infinity,
        maxLon: -Infinity,
        minLat: Infinity,
        maxLat: -Infinity,
      },
    );
    const center = {
      lon: (bounds.minLon + bounds.maxLon) / 2,
      lat: (bounds.minLat + bounds.maxLat) / 2,
    };

    let radiusMeters = data.initialRadiusMeters;
    let nearby = candidates
      .map((row) => ({
        ...row,
        distance: distanceMeters(row.center, center),
      }))
      .filter((row) => row.distance <= radiusMeters);

    while (nearby.length < 160 && radiusMeters < 3_200) {
      radiusMeters *= 1.65;
      nearby = candidates
        .map((row) => ({
          ...row,
          distance: distanceMeters(row.center, center),
        }))
        .filter((row) => row.distance <= radiusMeters);
    }

    nearby.sort((a, b) => a.distance - b.distance);
    const limit = Math.max(1, data.maxFeatures);
    const selected =
      nearby.length <= limit
        ? nearby
        : Array.from({ length: limit }, (_, index) => {
            const slot = Math.floor((index * nearby.length) / limit);
            return nearby[slot];
          });

    workerScope.postMessage({
      kind: "success",
      features: selected.map((row) => row.feature),
      totalFeatures: allFeatures.length,
      center,
      radiusMeters,
    });
  } catch (error) {
    workerScope.postMessage({
      kind: "error",
      message:
        error instanceof Error
          ? error.message
          : "Unable to load the Bhopal 3D dataset.",
    });
  }
};
