-- PESTEL Reports Table
-- NOTE: id is TEXT because component uses Date.now().toString()
create table pestel_reports (
  id text primary key,
  input jsonb not null,
  result_data jsonb not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table pestel_reports enable row level security;

-- Create separate policies for each operation
create policy "pestel_select" on pestel_reports for select using (true);
create policy "pestel_insert" on pestel_reports for insert with check (true);
create policy "pestel_update" on pestel_reports for update using (true) with check (true);
create policy "pestel_delete" on pestel_reports for delete using (true);
