// Supabase generated types
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
      clients: {
        Row: {
          id: string
          name: string
          email: string | null
          company: string | null
          website_url: string | null
          brand_questionnaire: Json | null
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          company?: string | null
          website_url?: string | null
          brand_questionnaire?: Json | null
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          company?: string | null
          website_url?: string | null
          brand_questionnaire?: Json | null
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          client_id: string
          airtable_id: string | null
          name: string
          type: 'campaign' | 'flow'
          status: 'draft' | 'in_progress' | 'completed' | 'archived'
          deadline: string | null
          brief: string | null
          campaign_context: string | null
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          client_id: string
          airtable_id?: string | null
          name: string
          type: 'campaign' | 'flow'
          status?: 'draft' | 'in_progress' | 'completed' | 'archived'
          deadline?: string | null
          brief?: string | null
          campaign_context?: string | null
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          client_id?: string
          airtable_id?: string | null
          name?: string
          type?: 'campaign' | 'flow'
          status?: 'draft' | 'in_progress' | 'completed' | 'archived'
          deadline?: string | null
          brief?: string | null
          campaign_context?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      email_copy: {
        Row: {
          id: string
          campaign_id: string
          subject_line: string
          preview_text: string | null
          email_body: string
          copy_type: 'promotional' | 'nurture' | 'welcome' | 'abandoned_cart' | 'newsletter' | 'transactional'
          version: number
          is_active: boolean
          performance_notes: string | null
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          campaign_id: string
          subject_line: string
          preview_text?: string | null
          email_body: string
          copy_type: 'promotional' | 'nurture' | 'welcome' | 'abandoned_cart' | 'newsletter' | 'transactional'
          version?: number
          is_active?: boolean
          performance_notes?: string | null
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          campaign_id?: string
          subject_line?: string
          preview_text?: string | null
          email_body?: string
          copy_type?: 'promotional' | 'nurture' | 'welcome' | 'abandoned_cart' | 'newsletter' | 'transactional'
          version?: number
          is_active?: boolean
          performance_notes?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      client_notes: {
        Row: {
          id: string
          client_id: string
          note: string
          category: 'insight' | 'preference' | 'feedback' | 'general'
          created_by: string
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          client_id: string
          note: string
          category?: 'insight' | 'preference' | 'feedback' | 'general'
          created_by: string
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          client_id?: string
          note?: string
          category?: 'insight' | 'preference' | 'feedback' | 'general'
          created_by?: string
          created_at?: string
          user_id?: string
        }
      }
      scraped_content: {
        Row: {
          id: string
          client_id: string
          url: string
          title: string | null
          content: string
          content_type: 'website' | 'product_page' | 'about' | 'landing_page'
          last_scraped: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          id?: string
          client_id: string
          url: string
          title?: string | null
          content: string
          content_type: 'website' | 'product_page' | 'about' | 'landing_page'
          last_scraped?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          id?: string
          client_id?: string
          url?: string
          title?: string | null
          content?: string
          content_type?: 'website' | 'product_page' | 'about' | 'landing_page'
          last_scraped?: string
          is_active?: boolean
          user_id?: string
        }
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