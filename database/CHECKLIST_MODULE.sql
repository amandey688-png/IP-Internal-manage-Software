-- ============================================================================
-- CHECKLIST MODULE - Task / Checklist
-- ============================================================================
-- Run in Supabase SQL Editor after FRESH_SETUP.sql
-- ============================================================================

-- Departments for checklist tasks
CREATE TABLE IF NOT EXISTS public.checklist_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.checklist_departments (name) VALUES
    ('Customer Support & Success'),
    ('Marketing'),
    ('Accounts & Admin'),
    ('Internal Development')
ON CONFLICT (name) DO NOTHING;

-- Holiday list (per year, uploadable from Dec 15)
CREATE TABLE IF NOT EXISTS public.checklist_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_date DATE NOT NULL,
    holiday_name TEXT NOT NULL,
    year SMALLINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(holiday_date, year)
);

CREATE INDEX IF NOT EXISTS idx_checklist_holidays_year ON public.checklist_holidays(year);
CREATE INDEX IF NOT EXISTS idx_checklist_holidays_date ON public.checklist_holidays(holiday_date);

-- Insert default India 2026 holidays (user-provided list)
INSERT INTO public.checklist_holidays (holiday_date, holiday_name, year) VALUES
    ('2026-01-01', 'New Year''s Day', 2026),
    ('2026-01-26', 'Republic Day', 2026),
    ('2026-03-03', 'Doljatra', 2026),
    ('2026-03-04', 'Holi', 2026),
    ('2026-05-01', 'May Day', 2026),
    ('2026-08-15', 'Independence Day', 2026),
    ('2026-09-14', 'Ganesh Chaturthi', 2026),
    ('2026-10-02', 'Gandhi Jayanti', 2026),
    ('2026-10-17', 'Dussehra/Durga Puja (Maha Saptami)', 2026),
    ('2026-10-18', 'Dussehra/Durga Puja (Maha Saptami)', 2026),
    ('2026-10-19', 'Dussehra/Durga Puja (Maha Asthami)', 2026),
    ('2026-10-20', 'Dussehra/Durga Puja (Maha Navami)', 2026),
    ('2026-10-21', 'Dussehra/Durga Puja (Maha Dashami)', 2026),
    ('2026-11-08', 'Kalipuja', 2026),
    ('2026-11-09', 'Diwali', 2026),
    ('2026-11-11', 'Bhai Duj/ Bhai Fota', 2026),
    ('2026-12-25', 'Christmas Day', 2026)
ON CONFLICT (holiday_date, year) DO NOTHING;

-- Checklist tasks (recurring task definitions)
CREATE TABLE IF NOT EXISTS public.checklist_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_name TEXT NOT NULL,
    doer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    department TEXT NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('D', 'W', 'M', 'Q', 'F', 'Y')),
    start_date DATE NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    reference_no TEXT
);

CREATE INDEX IF NOT EXISTS idx_checklist_tasks_doer ON public.checklist_tasks(doer_id);
CREATE INDEX IF NOT EXISTS idx_checklist_tasks_start ON public.checklist_tasks(start_date);

-- Completions: when user clicks Submit for a task on a specific occurrence date
CREATE TABLE IF NOT EXISTS public.checklist_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.checklist_tasks(id) ON DELETE CASCADE,
    occurrence_date DATE NOT NULL,
    completed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_checklist_completions_task_date UNIQUE(task_id, occurrence_date)
);

CREATE INDEX IF NOT EXISTS idx_checklist_completions_task ON public.checklist_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_checklist_completions_date ON public.checklist_completions(occurrence_date);

-- Track sent reminder emails (one per user per date - send only once)
CREATE TABLE IF NOT EXISTS public.checklist_reminder_sent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reminder_date DATE NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, reminder_date)
);
CREATE INDEX IF NOT EXISTS idx_checklist_reminder_sent_date ON public.checklist_reminder_sent(reminder_date);
