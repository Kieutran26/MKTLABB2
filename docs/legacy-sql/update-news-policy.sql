-- Allow anonymous inserts for the News Aggregator (since server uses anon key)
create policy "Allow public insert access"
on public.news_articles for insert
to anon
with check (true);

-- Also allow update just in case
create policy "Allow public update access"
on public.news_articles for update
to anon
using (true);
