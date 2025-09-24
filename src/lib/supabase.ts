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

  async createClient(client: Omit<Database['public']['Tables']['clients']['Insert'], 'user_id'>): Promise<any> {
    console.log('🗄️ DB SERVICE: Starting createClient (internal tool - no auth)...');
    
    try {
      // Internal tool: use fixed UUID, no authentication required
      const insertData = { ...client, user_id: '12345678-1234-1234-1234-123456789abc' };
      console.log('📝 DB SERVICE: Insert data prepared:', insertData);
      
      const { data, error } = await this.supabase
        .from('clients')
        .insert(insertData as any)
        .select()
        .single();
      
      console.log('📊 DB SERVICE: Supabase response:', { data, error });
      
      if (error) {
        console.error('❌ DB SERVICE: Insert error:', error);
        throw error;
      }
      
      console.log('✅ DB SERVICE: Client created successfully');
      return data;
      
    } catch (dbError) {
      console.error('💥 DB SERVICE: Exception in createClient:', dbError);
      console.error('🔍 DB SERVICE: Exception details:', {
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
        code: (dbError as any)?.code,
        details: (dbError as any)?.details,
        hint: (dbError as any)?.hint
      });
      throw dbError;
    }
  }

  async updateClient(id: string, updates: any): Promise<any> {
    const { data, error } = await (this.supabase as any)
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

  async createCampaign(campaign: Omit<Database['public']['Tables']['campaigns']['Insert'], 'user_id'>): Promise<any> {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      // For development: use service role to bypass RLS
        const { data, error } = await supabaseAdmin
          .from('campaigns')
          .insert({ ...campaign, user_id: '12345678-1234-1234-1234-123456789abc' } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }

    // Production: normal user-authenticated insert
    const { data, error } = await this.supabase
      .from('campaigns')
      .insert({ ...campaign, user_id: user.id } as any)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateCampaign(id: string, updates: any): Promise<any> {
    const { data, error } = await (this.supabase as any)
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteCampaign(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('campaigns')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
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

  async createEmailCopy(emailCopy: Omit<Database['public']['Tables']['email_copy']['Insert'], 'user_id'>): Promise<any> {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      // For development: use service role to bypass RLS
      const { data, error } = await supabaseAdmin
        .from('email_copy')
        .insert({ ...emailCopy, user_id: 'dev-user-123' } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }

    // Production: normal user-authenticated insert
    const { data, error } = await this.supabase
      .from('email_copy')
      .insert({ ...emailCopy, user_id: user.id } as any)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateEmailCopy(id: string, updates: any): Promise<any> {
    const { data, error } = await (this.supabase as any)
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

  async createClientNote(note: Omit<Database['public']['Tables']['client_notes']['Insert'], 'user_id' | 'created_by'>): Promise<any> {
    console.log('🗄️ DB SERVICE: Starting createClientNote (internal tool - no auth)...');
    
    try {
      // Internal tool: use fixed UUID, no authentication required
      const userId = '12345678-1234-1234-1234-123456789abc';
      
      const insertData = { 
        ...note, 
        user_id: userId,
        created_by: userId 
      };
      console.log('📝 DB SERVICE: Note insert data prepared:', insertData);

      const { data, error } = await this.supabase
        .from('client_notes')
        .insert(insertData as any)
        .select()
        .single();
      
      console.log('📊 DB SERVICE: Supabase response:', { data, error });
      
      if (error) {
        console.error('❌ DB SERVICE: Note insert error:', error);
        throw error;
      }
      
      console.log('✅ DB SERVICE: Note created successfully');
      return data;
      
    } catch (dbError) {
      console.error('💥 DB SERVICE: Exception in createClientNote:', dbError);
      console.error('🔍 DB SERVICE: Exception details:', {
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
        code: (dbError as any)?.code,
        details: (dbError as any)?.details,
        hint: (dbError as any)?.hint
      });
      throw dbError;
    }
  }

  async updateClientNote(id: string, updates: { note: string; category: string }): Promise<any> {
    console.log('🗄️ DB SERVICE: Starting updateClientNote for ID:', id);
    
    try {
      console.log('📝 DB SERVICE: Note update data:', updates);

      const { data, error } = await (this.supabase as any)
        .from('client_notes')
        .update({
          note: updates.note,
          category: updates.category
        })
        .eq('id', id)
        .select()
        .single();
      
      console.log('📊 DB SERVICE: Supabase response:', { data, error });
      
      if (error) {
        console.error('❌ DB SERVICE: Note update error:', error);
        throw error;
      }
      
      console.log('✅ DB SERVICE: Note updated successfully');
      return data;
      
    } catch (dbError) {
      console.error('💥 DB SERVICE: Exception in updateClientNote:', dbError);
      throw dbError;
    }
  }

  async deleteClientNote(id: string): Promise<void> {
    console.log('🗄️ DB SERVICE: Starting deleteClientNote for ID:', id);
    
    try {
      const { error } = await this.supabase
        .from('client_notes')
        .delete()
        .eq('id', id);
      
      console.log('📊 DB SERVICE: Delete response:', { error });
      
      if (error) {
        console.error('❌ DB SERVICE: Note delete error:', error);
        throw error;
      }
      
      console.log('✅ DB SERVICE: Note deleted successfully');
      
    } catch (dbError) {
      console.error('💥 DB SERVICE: Exception in deleteClientNote:', dbError);
      throw dbError;
    }
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

  async createScrapedContent(content: Omit<Database['public']['Tables']['scraped_content']['Insert'], 'user_id'>): Promise<any> {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    // For development: use a default user ID if no user is authenticated
    const userId = user?.id || 'dev-user-' + Date.now();

    const { data, error } = await this.supabase
      .from('scraped_content')
      .insert({ ...content, user_id: userId } as any)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Save copy data for shareable links
  async saveCopy(copyData: {
    campaign_name: string;
    client: string;
    send_date: string;
    subject_lines: string[];
    preview_text: string[];
    email_blocks: any[];
    selected_subject: number;
    selected_preview: number;
    airtable_id?: string;
  }): Promise<any> {
    // Import and use file-based storage
    const { CopyStorage } = await import('@/lib/copy-storage');
    return await CopyStorage.saveCopy(copyData);
  }

  async getSavedCopy(id: string): Promise<any> {
    // Import and use file-based storage
    const { CopyStorage } = await import('@/lib/copy-storage');
    return await CopyStorage.getCopy(id);
  }

  async updateSavedCopy(id: string, updates: any): Promise<any> {
    // Mock update for now
    console.log('✅ SUPABASE: Mock copy updated:', id);
    return { id, ...updates, updated_at: new Date().toISOString() };
  }
}
    return { id, ...updates, updated_at: new Date().toISOString() };
  }
}