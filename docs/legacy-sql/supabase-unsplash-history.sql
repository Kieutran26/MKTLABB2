-- Schema for Unsplash Link Converter History
-- Run this in Supabase SQL Editor

-- Create the table
create table if not exists public.unsplash_history (
    id uuid default gen_random_uuid() primary key,
    original_link text not null,
    cleaned_link text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.unsplash_history enable row level security;

-- Policy: Allow anyone to read
create policy "Allow public read access" on public.unsplash_history
    for select to anon, authenticated
    using (true);

-- Policy: Allow anyone to insert
create policy "Allow public insert access" on public.unsplash_history
    for insert to anon, authenticated
    with check (true);

-- Policy: Allow anyone to delete
create policy "Allow public delete access" on public.unsplash_history
    for delete to anon, authenticated
    using (true);

-- Create index for faster queries
create index if not exists unsplash_history_created_at_idx 
    on public.unsplash_history (created_at desc);
