
export type TripGender = "male" | "female" | "mixed";
export type TripLocation = "israel" | "us" | "international";

export interface Trip {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  websiteUrl?: string;
  organizer: {
    name: string;
    contact: string;
  };
  gender: TripGender;
  location: TripLocation;
  spots: number;
  brochureImage?: string;
  gallery?: string[];
  videoLinks?: string[];
}
