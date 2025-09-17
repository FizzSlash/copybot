-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Create clients table
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text,
  company text,
  website_url text,
  brand_questionnaire jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade not null
);

-- Create campaigns table
create table public.campaigns (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  airtable_id text unique,
  name text not null,
  type text check (type in ('campaign', 'flow')) not null,
  status text check (status in ('draft', 'in_progress', 'completed', 'archived')) default 'draft',
  deadline timestamp with time zone,
  brief text,
  campaign_context text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade not null
);

-- Create email_copy table
create table public.email_copy (
  id uuid default uuid_generate_v4() primary key,
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  subject_line text not null,
  preview_text text,
  email_body text not null,
  copy_type text check (copy_type in ('promotional', 'nurture', 'welcome', 'abandoned_cart', 'newsletter', 'transactional')) not null,
  version integer default 1,
  is_active boolean default true,
  performance_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade not null
);

-- Create client_notes table
create table public.client_notes (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  note text not null,
  category text check (category in ('insight', 'preference', 'feedback', 'general')) default 'general',
  created_by uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade not null
);

-- Create scraped_content table
create table public.scraped_content (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  url text not null,
  title text,
  content text not null,
  content_type text check (content_type in ('website', 'product_page', 'about', 'landing_page')) not null,
  last_scraped timestamp with time zone default timezone('utc'::text, now()) not null,
  is_active boolean default true,
  user_id uuid references auth.users(id) on delete cascade not null
);

-- Create indexes for better performance
create index clients_user_id_idx on public.clients(user_id);
create index campaigns_client_id_idx on public.campaigns(client_id);
create index campaigns_user_id_idx on public.campaigns(user_id);
create index campaigns_airtable_id_idx on public.campaigns(airtable_id);
create index email_copy_campaign_id_idx on public.email_copy(campaign_id);
create index email_copy_user_id_idx on public.email_copy(user_id);
create index client_notes_client_id_idx on public.client_notes(client_id);
create index client_notes_user_id_idx on public.client_notes(user_id);
create index scraped_content_client_id_idx on public.scraped_content(client_id);
create index scraped_content_user_id_idx on public.scraped_content(user_id);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_updated_at before update on public.clients
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.campaigns
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.email_copy
  for each row execute procedure public.handle_updated_at();

-- Enable Row Level Security (RLS)
alter table public.clients enable row level security;
alter table public.campaigns enable row level security;
alter table public.email_copy enable row level security;
alter table public.client_notes enable row level security;
alter table public.scraped_content enable row level security;

-- Create RLS policies
create policy "Users can view own clients" on public.clients
  for select using (auth.uid() = user_id);
create policy "Users can insert own clients" on public.clients
  for insert with check (auth.uid() = user_id);
create policy "Users can update own clients" on public.clients
  for update using (auth.uid() = user_id);
create policy "Users can delete own clients" on public.clients
  for delete using (auth.uid() = user_id);

create policy "Users can view own campaigns" on public.campaigns
  for select using (auth.uid() = user_id);
create policy "Users can insert own campaigns" on public.campaigns
  for insert with check (auth.uid() = user_id);
create policy "Users can update own campaigns" on public.campaigns
  for update using (auth.uid() = user_id);
create policy "Users can delete own campaigns" on public.campaigns
  for delete using (auth.uid() = user_id);

create policy "Users can view own email copy" on public.email_copy
  for select using (auth.uid() = user_id);
create policy "Users can insert own email copy" on public.email_copy
  for insert with check (auth.uid() = user_id);
create policy "Users can update own email copy" on public.email_copy
  for update using (auth.uid() = user_id);
create policy "Users can delete own email copy" on public.email_copy
  for delete using (auth.uid() = user_id);

create policy "Users can view own client notes" on public.client_notes
  for select using (auth.uid() = user_id);
create policy "Users can insert own client notes" on public.client_notes
  for insert with check (auth.uid() = user_id);
create policy "Users can update own client notes" on public.client_notes
  for update using (auth.uid() = user_id);
create policy "Users can delete own client notes" on public.client_notes
  for delete using (auth.uid() = user_id);

create policy "Users can view own scraped content" on public.scraped_content
  for select using (auth.uid() = user_id);
create policy "Users can insert own scraped content" on public.scraped_content
  for insert with check (auth.uid() = user_id);
create policy "Users can update own scraped content" on public.scraped_content
  for update using (auth.uid() = user_id);
create policy "Users can delete own scraped content" on public.scraped_content
  for delete using (auth.uid() = user_id);