// Core database types
export interface Client {
  id: string;
  name: string;
  email?: string;
  company?: string;
  brand_questionnaire?: BrandQuestionnaire;
  website_url?: string;
  created_at: string;
  updated_at: string;
}

export interface BrandQuestionnaire {
  target_audience: string;
  brand_voice: string;
  brand_personality: string[];
  key_messaging: string;
  competitors: string[];
  pain_points: string[];
  unique_value_props: string[];
  content_preferences: string;
  tone_examples: string;
}

export interface Campaign {
  id: string;
  client_id: string;
  airtable_id?: string;
  name: string;
  type: 'campaign' | 'flow';
  status: 'draft' | 'in_progress' | 'completed' | 'archived';
  deadline?: string;
  brief?: string;
  campaign_context?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface EmailCopy {
  id: string;
  campaign_id: string;
  subject_line: string;
  preview_text?: string;
  email_body: string;
  copy_type: 'promotional' | 'nurture' | 'welcome' | 'abandoned_cart' | 'newsletter' | 'transactional';
  version: number;
  is_active: boolean;
  performance_notes?: string;
  created_at: string;
  updated_at: string;
  campaign?: Campaign;
}

export interface ClientNote {
  id: string;
  client_id: string;
  note: string;
  category?: 'insight' | 'preference' | 'feedback' | 'general';
  created_by: string;
  created_at: string;
  client?: Client;
}

export interface ScrapedContent {
  id: string;
  client_id: string;
  url: string;
  title?: string;
  content: string;
  content_type: 'website' | 'product_page' | 'about' | 'landing_page';
  last_scraped: string;
  is_active: boolean;
  client?: Client;
}

// Airtable integration types
export interface AirtableRecord {
  id: string;
  fields: {
    [key: string]: any;
  };
  createdTime: string;
}

export interface AirtableCampaign {
  id: string;
  name: string;
  client: string;
  status: string;
  deadline?: string;
  brief?: string;
  campaign_type?: string;
  priority?: string;
}

// Copy generation types
export interface CopyGenerationRequest {
  campaign_id: string;
  copy_type: EmailCopy['copy_type'];
  tone?: 'professional' | 'friendly' | 'urgent' | 'playful' | 'authoritative';
  length?: 'short' | 'medium' | 'long';
  focus?: string;
  additional_context?: string;
}

export interface CopyGenerationResponse {
  subject_lines: string[];
  preview_text: string;
  email_body: string;
  alternative_versions?: {
    subject_line: string;
    email_body: string;
  }[];
}

// UI/Form types
export interface CampaignFormData {
  name: string;
  client_id: string;
  type: Campaign['type'];
  deadline?: string;
  brief?: string;
  campaign_context?: string;
}

export interface ClientFormData {
  name: string;
  email?: string;
  company?: string;
  website_url?: string;
}

export interface BrandQuestionnaireFormData extends BrandQuestionnaire {}

// API response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}