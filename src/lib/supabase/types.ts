export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cron_job_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          execution_time_ms: number | null
          failed_posts: number | null
          id: string
          job_name: string
          started_at: string
          status: string
          successful_posts: number | null
          total_posts: number | null
          window_end: string
          window_start: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          failed_posts?: number | null
          id?: string
          job_name?: string
          started_at?: string
          status?: string
          successful_posts?: number | null
          total_posts?: number | null
          window_end: string
          window_start: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          failed_posts?: number | null
          id?: string
          job_name?: string
          started_at?: string
          status?: string
          successful_posts?: number | null
          total_posts?: number | null
          window_end?: string
          window_start?: string
        }
        Relationships: []
      }
      linkedin_post_images: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          image_file_size: number | null
          image_file_type: string | null
          image_original_name: string | null
          image_upload_error: string | null
          image_upload_status: string | null
          image_url: string | null
          linkedin_image_urn: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_file_size?: number | null
          image_file_type?: string | null
          image_original_name?: string | null
          image_upload_error?: string | null
          image_upload_status?: string | null
          image_url?: string | null
          linkedin_image_urn?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_file_size?: number | null
          image_file_type?: string | null
          image_original_name?: string | null
          image_upload_error?: string | null
          image_upload_status?: string | null
          image_url?: string | null
          linkedin_image_urn?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_post_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "linkedin_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_posts: {
        Row: {
          created_at: string | null
          error_message: string | null
          failed_at: string | null
          id: string
          is_repost: boolean | null
          linkedin_profile_id: string
          original_post_urn: string | null
          published_at: string | null
          scheduled_for: string | null
          status: string
          text: string
          ugc_post_id: string | null
          updated_at: string | null
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          is_repost?: boolean | null
          linkedin_profile_id: string
          original_post_urn?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          text: string
          ugc_post_id?: string | null
          updated_at?: string | null
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          is_repost?: boolean | null
          linkedin_profile_id?: string
          original_post_urn?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          text?: string
          ugc_post_id?: string | null
          updated_at?: string | null
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_posts_linkedin_profile_id_fkey"
            columns: ["linkedin_profile_id"]
            isOneToOne: false
            referencedRelation: "linkedin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_profiles: {
        Row: {
          access_token: string
          access_token_expires_at: string
          created_at: string | null
          id: string
          linkedin_member_id: string
          person_urn: string
          refresh_token: string | null
          refresh_token_expires_at: string | null
          scope: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          access_token_expires_at: string
          created_at?: string | null
          id?: string
          linkedin_member_id: string
          person_urn: string
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          scope: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          access_token_expires_at?: string
          created_at?: string | null
          id?: string
          linkedin_member_id?: string
          person_urn?: string
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          scope?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          email: string
          id: string
          is_admin: boolean
          name: string
          next_billing_date: string | null
          phone: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_canceled_at: string | null
          subscription_created_at: string | null
          subscription_plan: string | null
          subscription_status: string | null
          trial_end: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          email: string
          id: string
          is_admin?: boolean
          name: string
          next_billing_date?: string | null
          phone?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_canceled_at?: string | null
          subscription_created_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          trial_end?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          email?: string
          id?: string
          is_admin?: boolean
          name?: string
          next_billing_date?: string | null
          phone?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_canceled_at?: string | null
          subscription_created_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          trial_end?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      expire_free_trials: { Args: never; Returns: undefined }
      get_cron_job_id: { Args: { job_name: string }; Returns: number }
      get_posts_for_window: {
        Args: { p_from: string; p_to: string }
        Returns: {
          id: string
          images: Json
          scheduled_for: string
          text: string
          user_id: string
          visibility: string
        }[]
      }
      get_queue_status: { Args: never; Returns: Json }
      get_upcoming_posts: { Args: { hours_ahead?: number }; Returns: Json }
      process_cron_job_responses: { Args: never; Returns: undefined }
      publish_scheduled_linkedin_posts: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
