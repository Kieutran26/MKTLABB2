-- Create table for storing news articles
create table if not exists public.news_articles (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  link text not null unique,
  pub_date timestamptz,
  source text not null,
  category text,
  summary text,
  image_url text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.news_articles enable row level security;

-- Create policy to allow read access for authenticated users
create policy "Allow read access for authenticated users"
on public.news_articles for select
to authenticated
using (true);

-- Create policy to allow insert/update for service role (or authenticated if needed for testing)
-- For now, we'll allow all access for simplicity in dev, or better, public read
create policy "Allow public read access"
on public.news_articles for select
to anon
using (true);

-- Indexes for performance
create index if not exists news_articles_pub_date_idx on public.news_articles (pub_date desc);
create index if not exists news_articles_category_idx on public.news_articles (category);
