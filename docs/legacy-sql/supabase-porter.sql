-- Porter's Five Forces Analyses Table
create table porter_analyses (
  id text primary key,
  input jsonb not null,
  result_data jsonb not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table porter_analyses enable row level security;

-- Create separate policies for each operation
create policy "porter_select" on porter_analyses for select using (true);
create policy "porter_insert" on porter_analyses for insert with check (true);
create policy "porter_update" on porter_analyses for update using (true) with check (true);
create policy "porter_delete" on porter_analyses for delete using (true);
