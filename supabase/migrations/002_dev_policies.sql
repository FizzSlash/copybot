-- Add development-friendly RLS policies that allow service role access
-- This enables local development without authentication

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can insert own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can insert own email copy" ON public.email_copy;
DROP POLICY IF EXISTS "Users can insert own client notes" ON public.client_notes;
DROP POLICY IF EXISTS "Users can insert own scraped content" ON public.scraped_content;

-- Create new policies that allow service role (for development)
CREATE POLICY "Users can insert own clients or service role" ON public.clients
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Users can insert own campaigns or service role" ON public.campaigns
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Users can insert own email copy or service role" ON public.email_copy
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Users can insert own client notes or service role" ON public.client_notes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Users can insert own scraped content or service role" ON public.scraped_content
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'role' = 'service_role'
  );