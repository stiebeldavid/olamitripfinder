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
      trip_images: {
        Row: {
          created_at: string
          id: string
          image_path: string
          is_flyer: boolean | null
          is_thumbnail: boolean | null
          trip_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_path: string
          is_flyer?: boolean | null
          is_thumbnail?: boolean | null
          trip_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_path?: string
          is_flyer?: boolean | null
          is_thumbnail?: boolean | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_images_trip_id_fkey"
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
          is_internship: boolean | null
          location: Database["public"]["Enums"]["trip_location"]
          name: string
          organizer_contact: string
          organizer_name: string
          price: string | null
          show_trip: string
          spots: number | null
          start_date: string
          thumbnail_image: string | null
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
          is_internship?: boolean | null
          location: Database["public"]["Enums"]["trip_location"]
          name: string
          organizer_contact: string
          organizer_name: string
          price?: string | null
          show_trip?: string
          spots?: number | null
          start_date: string
          thumbnail_image?: string | null
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
          is_internship?: boolean | null
          location?: Database["public"]["Enums"]["trip_location"]
          name?: string
          organizer_contact?: string
          organizer_name?: string
          price?: string | null
          show_trip?: string
          spots?: number | null
          start_date?: string
          thumbnail_image?: string | null
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
      trip_location: "united_states" | "international" | "israel"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      trip_gender: ["mixed", "male", "female"],
      trip_location: ["united_states", "international", "israel"],
    },
  },
} as const
