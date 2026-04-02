-- Add DELETE policy for news_articles table
-- Run this in Supabase SQL Editor to fix the delete issue

-- Allow anonymous delete access (for client-side delete operations)
create policy "Allow public delete access"
on public.news_articles for delete
to anon
using (true);

-- Also allow authenticated users to delete
create policy "Allow authenticated delete access"
on public.news_articles for delete
to authenticated
using (true);
