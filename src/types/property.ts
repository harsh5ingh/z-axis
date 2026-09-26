export interface Property {
  ulpin: string;
  type: string;

  parcel: string;
  building: string;
  floor: string;
  unit: string;

  address: string;
  city: string;
  state: string;

  area: number;
  volume: number;

  elevation: {
    min: number;
    max: number;
  };

  usage: string;

  confidence: number;

  confidenceBreakdown: {
    evidence: number;
    geometry: number;
    position: number;
    sourceAgreement: number;
    validation: number;
  };

  status: "verified" | "under-review" | "unverified";

  floors: string[];

  features: string[];
}