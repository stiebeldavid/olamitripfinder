
export type TripGender = "male" | "female" | "mixed";
export type TripLocation = "united_states" | "international";

export interface Trip {
  id: string;
  trip_id: number;  // Adding this field to match the database structure
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
