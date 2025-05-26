

export type TripGender = "male" | "female" | "mixed";
export type TripLocation = "united_states" | "international" | "israel";

export interface TripImage {
  id: string;
  url: string;
  isThumbnail: boolean;
  isFlyer: boolean;
}

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
    email?: string;
    phone?: string;
  };
  gender: TripGender;
  location: TripLocation;
  spots: number;
  images: TripImage[];
  videoLinks?: string[];
  show_trip?: string;
  price?: string;
}
