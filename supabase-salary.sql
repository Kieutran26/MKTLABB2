-- ============================================
-- SMART SALARY FEATURE
-- ============================================

-- 1. Salary Config Table
-- Stores the user's salary configuration (gross, standard days, etc.)
-- Since we are in a single-user/simulated auth environment, we'll use a fixed ID or just one row.
-- For scalability, we'll use a 'default' ID.

DROP TABLE IF EXISTS salary_configs CASCADE;
CREATE TABLE salary_configs (
    id TEXT PRIMARY KEY DEFAULT 'default',
    gross NUMERIC NOT NULL DEFAULT 20000000,
    standard_days NUMERIC NOT NULL DEFAULT 22,
    work_on_saturday BOOLEAN DEFAULT false,
    ot_multiplier NUMERIC DEFAULT 1.5,
    reward_item_name TEXT DEFAULT 'Ly trà sữa',
    reward_item_price NUMERIC DEFAULT 50000,
    start_work_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE salary_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on salary_configs" ON salary_configs FOR ALL USING (true) WITH CHECK (true);


-- 2. Salary Attendance Table
-- Stores daily attendance status (FULL, HALF, OFF, LEAVE, OT)
DROP TABLE IF EXISTS salary_attendance CASCADE;
CREATE TABLE salary_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_str DATE NOT NULL UNIQUE, -- YYYY-MM-DD
    type TEXT NOT NULL CHECK (type IN ('FULL', 'HALF', 'OFF', 'LEAVE', 'OT')),
    ot_hours NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE salary_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on salary_attendance" ON salary_attendance FOR ALL USING (true) WITH CHECK (true);

-- Insert default config if not exists
INSERT INTO salary_configs (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;
