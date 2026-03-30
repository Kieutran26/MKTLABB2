-- STP Analyses Table
create table stp_analyses (
  id text primary key,
  input_data jsonb not null,
  result_data jsonb not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table stp_analyses enable row level security;

-- Create separate policies for each operation
create policy "stp_select" on stp_analyses for select using (true);
create policy "stp_insert" on stp_analyses for insert with check (true);
create policy "stp_update" on stp_analyses for update using (true) with check (true);
create policy "stp_delete" on stp_analyses for delete using (true);
