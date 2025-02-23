
export type TripGender = "male" | "female" | "mixed";
export type TripLocation = "united_states" | "international";

export interface Trip {
  id: string;
  trip_id: number;
  name: string;
  description: string;
  start_date: string;  // Changed from startDate to match DB
  end_date: string;    // Changed from endDate to match DB
  website_url?: string;
  organizer_name: string;  // Changed from organizer.name
  organizer_contact: string;  // Changed from organizer.contact
  gender: TripGender;
  location: TripLocation;
  spots: number;
  brochure_image_path?: string;
  show_trip: string;
  created_at: string;
  updated_at: string;
}
