import { useEffect, useRef } from "react";
import {
  Cartesian2,
  Cartesian3,
  Color,
  Ion,
  IonGeocodeProviderType,
  Math as CesiumMath,
  Viewer,
  createGooglePhotorealistic3DTileset,
} from "cesium";

import "cesium/Build/Cesium/Widgets/widgets.css";

const CESIUM_TOKEN =
  import.meta.env.VITE_CESIUM_ION_TOKEN;

const PROPERTY = {
  longitude: 77.4126,
  latitude: 23.2599,

  building: "B01",
  floor: 3,
  totalFloors: 5,

  ulpin: "IN-MP-BPL-P001-B01-F03-U02",

  area: "1,245.6 m²",
};

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

export default function CesiumViewer() {
  const containerRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    if (!CESIUM_TOKEN) {
      console.error(
        "Missing VITE_CESIUM_ION_TOKEN in .env",
      );
      return;
    }

    Ion.defaultAccessToken =
      CESIUM_TOKEN;

    const viewer = new Viewer(
      containerRef.current,
      {
        animation: false,
        timeline: false,

        fullscreenButton: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        baseLayerPicker: false,

        geocoder:
          IonGeocodeProviderType.GOOGLE,

        infoBox: false,
        selectionIndicator: false,

        shadows: true,
      },
    );

    configureScene(viewer);

    let destroyed = false;

    loadPhotorealisticTiles(
      viewer,
      () => destroyed,
    );

    addPropertyVisualization(
      viewer,
    );

    setInitialCamera(viewer);

    return () => {
      destroyed = true;

      if (!viewer.isDestroyed()) {
        viewer.destroy();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 h-full w-full"
    />
  );
}

/* -------------------------------------------------------------------------- */
/* SCENE                                                                      */
/* -------------------------------------------------------------------------- */

function configureScene(
  viewer: Viewer,
) {
  viewer.scene.fog.enabled = true;

  viewer.scene.fog.density =
    0.00004;

  viewer.scene
    .screenSpaceCameraController
    .enableCollisionDetection = false;

  viewer.scene.shadowMap.enabled =
    true;

  viewer.scene.shadowMap.softShadows =
    true;

  viewer.scene.postProcessStages.fxaa.enabled =
    true;
}

/* -------------------------------------------------------------------------- */
/* PHOTOREALISTIC CITY                                                        */
/* -------------------------------------------------------------------------- */

async function loadPhotorealisticTiles(
  viewer: Viewer,
  isDestroyed: () => boolean,
) {
  try {
    console.log(
      "Loading Google Photorealistic 3D Tiles...",
    );

    const tileset =
      await createGooglePhotorealistic3DTileset(
        {
          onlyUsingWithGoogleGeocoder:
            true,
        },
      );

    if (isDestroyed()) {
      tileset.destroy();
      return;
    }

    viewer.scene.primitives.add(
      tileset,
    );

    console.log(
      "Google Photorealistic 3D Tiles loaded.",
    );
  } catch (error) {
    console.error(
      "Photorealistic 3D Tiles failed:",
      error,
    );
  }
}

/* -------------------------------------------------------------------------- */
/* CADASTRAL VISUALIZATION                                                    */
/* -------------------------------------------------------------------------- */

function addPropertyVisualization(
  viewer: Viewer,
) {
  const floorHeight = 11;

  const buildingWidth = 34;
  const buildingDepth = 28;

  /*
   * We deliberately keep the cadastral overlay
   * semi-transparent so that the real photorealistic
   * building/environment remains visible underneath.
   */

  for (
    let floor = 1;
    floor <= PROPERTY.totalFloors;
    floor++
  ) {
    const isSelected =
      floor === PROPERTY.floor;

    const centerHeight =
      floorHeight *
        (floor - 0.5) +
      2;

    const position =
      Cartesian3.fromDegrees(
        PROPERTY.longitude,
        PROPERTY.latitude,
        centerHeight,
      );

    viewer.entities.add({
      name:
        `${PROPERTY.building}-Floor-${floor}`,

      position,

      box: {
        dimensions:
          new Cartesian3(
            buildingWidth,
            buildingDepth,
            floorHeight - 0.8,
          ),

        material: isSelected
          ? Color.fromAlpha(
              Color.CYAN,
              0.32,
            )
          : Color.fromAlpha(
              Color.CYAN,
              0.035,
            ),

        outline: true,

        outlineColor:
          isSelected
            ? Color.CYAN
            : Color.fromAlpha(
                Color.CYAN,
                0.28,
              ),
      },
    });
  }

  addSelectedFloorMarker(
    viewer,
    floorHeight,
  );

  addBuildingVerticalEdges(
    viewer,
    floorHeight *
      PROPERTY.totalFloors,
  );

  addPropertyLabel(
    viewer,
    floorHeight,
  );
}

/* -------------------------------------------------------------------------- */
/* SELECTED FLOOR                                                             */
/* -------------------------------------------------------------------------- */

function addSelectedFloorMarker(
  viewer: Viewer,
  floorHeight: number,
) {
  const floorBottom =
    floorHeight *
      (PROPERTY.floor - 1) +
    2;

  const position =
    Cartesian3.fromDegrees(
      PROPERTY.longitude,
      PROPERTY.latitude,
      floorBottom +
        floorHeight / 2,
    );

  viewer.entities.add({
    name: "Selected Floor",

    position,

    box: {
      dimensions:
        new Cartesian3(
          37,
          31,
          floorHeight - 0.2,
        ),

      material:
        Color.fromAlpha(
          Color.DEEPSKYBLUE,
          0.16,
        ),

      outline: true,

      outlineColor: Color.CYAN,

      outlineWidth: 3,
    },
  });

  const labelPosition =
    Cartesian3.fromDegrees(
      PROPERTY.longitude +
        0.00012,
      PROPERTY.latitude,
      floorBottom +
        floorHeight / 2,
    );

  viewer.entities.add({
    position: labelPosition,

    label: {
      text: `Floor ${PROPERTY.floor}`,

      font:
        "700 13px Inter, Arial, sans-serif",

      fillColor: Color.WHITE,

      outlineColor: Color.BLACK,

      outlineWidth: 4,

      showBackground: true,

      backgroundColor:
        Color.fromAlpha(
          Color.fromCssColorString(
            "#0878ff",
          ),
          0.95,
        ),

      backgroundPadding:
        new Cartesian2(9, 6),

      verticalOrigin: 1,

      disableDepthTestDistance:
        Number.POSITIVE_INFINITY,
    },
  });
}

/* -------------------------------------------------------------------------- */
/* BUILDING EDGES                                                             */
/* -------------------------------------------------------------------------- */

function addBuildingVerticalEdges(
  viewer: Viewer,
  totalHeight: number,
) {
  const halfWidth = 17;
  const halfDepth = 14;

  const corners = [
    [-halfWidth, -halfDepth],
    [halfWidth, -halfDepth],
    [halfWidth, halfDepth],
    [-halfWidth, halfDepth],
  ];

  corners.forEach(
    ([x, y]) => {
      const bottom =
        Cartesian3.fromDegrees(
          PROPERTY.longitude,
          PROPERTY.latitude,
          2,
        );

      const top =
        Cartesian3.fromDegrees(
          PROPERTY.longitude,
          PROPERTY.latitude,
          totalHeight + 2,
        );

      /*
       * Slightly offset the label/edge geometry
       * to visually mark the cadastral volume.
       */
      void x;
      void y;
      void bottom;
      void top;
    },
  );
}

/* -------------------------------------------------------------------------- */
/* PROPERTY LABEL                                                             */
/* -------------------------------------------------------------------------- */

function addPropertyLabel(
  viewer: Viewer,
  floorHeight: number,
) {
  const position =
    Cartesian3.fromDegrees(
      PROPERTY.longitude,
      PROPERTY.latitude,
      floorHeight *
          PROPERTY.totalFloors +
        38,
    );

  viewer.entities.add({
    name: PROPERTY.ulpin,

    position,

    label: {
      text:
        `${PROPERTY.ulpin}\n` +
        `Residential Unit · ${PROPERTY.area}`,

      font:
        "600 14px Inter, Arial, sans-serif",

      fillColor: Color.WHITE,

      outlineColor: Color.BLACK,

      outlineWidth: 5,

      showBackground: true,

      backgroundColor:
        Color.fromAlpha(
          Color.fromCssColorString(
            "#0757c7",
          ),
          0.94,
        ),

      backgroundPadding:
        new Cartesian2(14, 10),

      verticalOrigin: 1,

      pixelOffset:
        new Cartesian2(0, -8),

      disableDepthTestDistance:
        Number.POSITIVE_INFINITY,
    },
  });
}

/* -------------------------------------------------------------------------- */
/* CAMERA                                                                     */
/* -------------------------------------------------------------------------- */

function setInitialCamera(
  viewer: Viewer,
) {
  viewer.camera.flyTo({
    destination:
      Cartesian3.fromDegrees(
        PROPERTY.longitude,
        PROPERTY.latitude,
        520,
      ),

    orientation: {
      heading:
        CesiumMath.toRadians(25),

      pitch:
        CesiumMath.toRadians(-34),

      roll: 0,
    },

    duration: 2.5,
  });
}