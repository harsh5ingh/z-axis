import type { Property } from "../types/property";

export const selectedProperty: Property = {
  ulpin: "IN-MP-BPL-P001-B01-F03-U02",

  type: "Residential Unit",

  parcel: "P001",
  building: "B01",
  floor: "03",
  unit: "U02",

  address: "Arera Colony",
  city: "Bhopal",
  state: "Madhya Pradesh",

  area: 1245.6,
  volume: 4357.1,

  elevation: {
    min: 510.5,
    max: 514.0,
  },

  usage: "Residential",

  confidence: 81.5,

  confidenceBreakdown: {
    evidence: 90,
    geometry: 98,
    position: 82,
    sourceAgreement: 74,
    validation: 91,
  },

  status: "verified",

  floors: [
    "Roof",
    "Floor 4",
    "Floor 3",
    "Floor 2",
    "Floor 1",
    "Ground",
    "Basement",
  ],

  features: [
    "3D Visualization",
    "Multi-Source Evidence",
    "Government Verified",
    "Digital ULPIN",
    "Downloadable Report",
  ],
};

export const recentSearches = [
  {
    id: "1",
    title: "IN-MP-BPL-P001-B01-F03-U02",
    subtitle: "Mixed Use Building · Bhopal",
    type: "unit",
  },
  {
    id: "2",
    title: "IN-MP-BPL-P001-B01",
    subtitle: "Building · Bhopal",
    type: "building",
  },
  {
    id: "3",
    title: "IN-MP-BPL-P001",
    subtitle: "Parcel · Bhopal",
    type: "parcel",
  },
  {
    id: "4",
    title: "Bhopal Railway Station",
    subtitle: "Landmark · Bhopal",
    type: "landmark",
  },
];