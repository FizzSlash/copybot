import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Client component client (for use in client components)
export const createSupabaseClient = () => createClientComponentClient<Database>();

// Server component client (for use in server components)
export const createSupabaseServerClient = () => createServerComponentClient<Database>({ cookies });

// Admin client (for server-side operations that require service role)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Database helper functions
export class DatabaseService {
  private supabase;

  constructor(supabaseClient = supabase) {
    this.supabase = supabaseClient;
  }

  // Client operations
  async getClients() {
    const { data, error } = await this.supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async getClient(id: string): Promise<any | null> {
    const { data, error } = await this.supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      throw error;
    }
    return data;
  }

  async createClient(client: Omit<Database['public']['Tables']['clients']['Insert'], 'user_id'>) {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .from('clients')
      .insert({ ...client, user_id: user.id })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateClient(id: string, updates: Partial<Database['public']['Tables']['clients']['Update']>) {
    const { data, error } = await this.supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteClient(id: string) {
    const { error } = await this.supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // Campaign operations
  async getCampaigns(clientId?: string) {
    let query = this.supabase
      .from('campaigns')
      .select(`
        *,
        clients (
          id,
          name,
          company
        )
      `)
      .order('created_at', { ascending: false });

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getCampaign(id: string): Promise<any | null> {
    const { data, error } = await this.supabase
      .from('campaigns')
      .select(`
        *,
        clients (
          id,
          name,
          company,
          brand_questionnaire,
          website_url
        ),
        email_copy (
          id,
          subject_line,
          preview_text,
          email_body,
          copy_type,
          version,
          is_active,
          created_at
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      throw error;
    }
    return data;
  }

  async createCampaign(campaign: Omit<Database['public']['Tables']['campaigns']['Insert'], 'user_id'>) {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .from('campaigns')
      .insert({ ...campaign, user_id: user.id })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateCampaign(id: string, updates: Partial<Database['public']['Tables']['campaigns']['Update']>) {
    const { data, error } = await this.supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Email copy operations
  async getEmailCopy(campaignId: string) {
    const { data, error } = await this.supabase
      .from('email_copy')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async createEmailCopy(emailCopy: Omit<Database['public']['Tables']['email_copy']['Insert'], 'user_id'>) {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .from('email_copy')
      .insert({ ...emailCopy, user_id: user.id })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateEmailCopy(id: string, updates: Partial<Database['public']['Tables']['email_copy']['Update']>) {
    const { data, error } = await this.supabase
      .from('email_copy')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Client notes operations
  async getClientNotes(clientId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('client_notes')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createClientNote(note: Omit<Database['public']['Tables']['client_notes']['Insert'], 'user_id' | 'created_by'>) {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .from('client_notes')
      .insert({ 
        ...note, 
        user_id: user.id,
        created_by: user.id 
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Scraped content operations
  async getScrapedContent(clientId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('scraped_content')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('last_scraped', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createScrapedContent(content: Omit<Database['public']['Tables']['scraped_content']['Insert'], 'user_id'>) {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .from('scraped_content')
      .insert({ ...content, user_id: user.id })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}