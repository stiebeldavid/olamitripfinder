
export type TripGender = "male" | "female" | "mixed";
export type TripLocation = "united_states" | "international" | "israel";

export interface Trip {
  id: string;
  trip_id: number;
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
  thumbnailImage?: string; // New field to store the selected thumbnail image
  gallery?: string[];
  videoLinks?: string[];
  show_trip?: string;
}
