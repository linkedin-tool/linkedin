export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          created_at: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_plan: string | null
          subscription_status: string | null
          current_period_end: string | null
          next_billing_date: string | null
          cancel_at_period_end: boolean | null
          trial_end: string | null
          subscription_created_at: string | null
          subscription_canceled_at: string | null
        }
        Insert: {
          id: string
          name: string
          email: string
          phone?: string | null
          created_at?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          current_period_end?: string | null
          next_billing_date?: string | null
          cancel_at_period_end?: boolean | null
          trial_end?: string | null
          subscription_created_at?: string | null
          subscription_canceled_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          created_at?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          current_period_end?: string | null
          next_billing_date?: string | null
          cancel_at_period_end?: boolean | null
          trial_end?: string | null
          subscription_created_at?: string | null
          subscription_canceled_at?: string | null
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
