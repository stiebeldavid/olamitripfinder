export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      trip_gallery: {
        Row: {
          created_at: string
          id: string
          image_path: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_path: string
          trip_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_path?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_gallery_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_videos: {
        Row: {
          created_at: string
          id: string
          trip_id: string
          video_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          trip_id: string
          video_url: string
        }
        Update: {
          created_at?: string
          id?: string
          trip_id?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_videos_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      TripInfo: {
        Row: {
          brochure_image_id: number | null
          created_at: string
          description: string | null
          destination: string | null
          duration_days: number | null
          end_date: string | null
          gender: string | null
          id: number
          number_spots: number | null
          organizer_email: string | null
          organizer_name: string | null
          registration_link: string | null
          start_date: string | null
          trip_image_url: string | null
          trip_name: string | null
          updated_at: string | null
        }
        Insert: {
          brochure_image_id?: number | null
          created_at?: string
          description?: string | null
          destination?: string | null
          duration_days?: number | null
          end_date?: string | null
          gender?: string | null
          id?: number
          number_spots?: number | null
          organizer_email?: string | null
          organizer_name?: string | null
          registration_link?: string | null
          start_date?: string | null
          trip_image_url?: string | null
          trip_name?: string | null
          updated_at?: string | null
        }
        Update: {
          brochure_image_id?: number | null
          created_at?: string
          description?: string | null
          destination?: string | null
          duration_days?: number | null
          end_date?: string | null
          gender?: string | null
          id?: number
          number_spots?: number | null
          organizer_email?: string | null
          organizer_name?: string | null
          registration_link?: string | null
          start_date?: string | null
          trip_image_url?: string | null
          trip_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trips: {
        Row: {
          brochure_image_path: string | null
          created_at: string
          description: string | null
          end_date: string
          gender: Database["public"]["Enums"]["trip_gender"]
          id: string
          location: Database["public"]["Enums"]["trip_location"]
          name: string
          organizer_contact: string
          organizer_name: string
          show_trip: string
          spots: number | null
          start_date: string
          trip_id: number
          updated_at: string
          website_url: string | null
        }
        Insert: {
          brochure_image_path?: string | null
          created_at?: string
          description?: string | null
          end_date: string
          gender?: Database["public"]["Enums"]["trip_gender"]
          id?: string
          location: Database["public"]["Enums"]["trip_location"]
          name: string
          organizer_contact: string
          organizer_name: string
          show_trip?: string
          spots?: number | null
          start_date: string
          trip_id?: number
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          brochure_image_path?: string | null
          created_at?: string
          description?: string | null
          end_date?: string
          gender?: Database["public"]["Enums"]["trip_gender"]
          id?: string
          location?: Database["public"]["Enums"]["trip_location"]
          name?: string
          organizer_contact?: string
          organizer_name?: string
          show_trip?: string
          spots?: number | null
          start_date?: string
          trip_id?: number
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      trip_gender: "mixed" | "male" | "female"
      trip_location: "united_states" | "international"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
