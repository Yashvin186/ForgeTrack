-- ForgeTrack Initial Schema Migration

-- 1. Tables

-- Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    usn TEXT UNIQUE NOT NULL,
    admission_number TEXT,
    email TEXT,
    branch_code TEXT NOT NULL,
    batch TEXT DEFAULT '2024-2028',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions Table
CREATE TABLE IF NOT EXISTS public.sessions (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    topic TEXT NOT NULL,
    month_number INTEGER NOT NULL,
    duration_hours DECIMAL(3,1) DEFAULT 2.0,
    session_type TEXT DEFAULT 'offline',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ImportLog Table
CREATE TABLE IF NOT EXISTS public.import_log (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_rows INTEGER NOT NULL,
    imported_rows INTEGER NOT NULL,
    skipped_rows INTEGER NOT NULL,
    warnings TEXT, -- JSON array
    column_mapping TEXT, -- JSON mapping
    status TEXT NOT NULL -- completed / partial / failed
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    session_id INTEGER NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    present BOOLEAN NOT NULL,
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    marked_by TEXT DEFAULT 'system',
    import_id INTEGER REFERENCES public.import_log(id),
    UNIQUE(student_id, session_id)
);

-- Materials Table
CREATE TABLE IF NOT EXISTS public.materials (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- slides / recording / document / link
    url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users Table (Public schema for RLS mapping)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('mentor', 'student')),
    student_id INTEGER REFERENCES public.students(id) ON DELETE SET NULL,
    display_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Constraints (CHECKs)
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_date_check;
ALTER TABLE public.sessions ADD CONSTRAINT sessions_date_check CHECK (date >= '2025-08-04' AND date <= CURRENT_DATE + INTERVAL '1 day');

-- 3. Row Level Security (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Policies

-- Mentors have full access to everything
-- Note: We assume role is checked via the public.users table

-- Students Table Policies
DROP POLICY IF EXISTS "mentors_all_students" ON public.students;
CREATE POLICY "mentors_all_students" ON public.students FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'mentor'));
DROP POLICY IF EXISTS "students_read_own" ON public.students;
CREATE POLICY "students_read_own" ON public.students FOR SELECT USING (id = (SELECT student_id FROM public.users WHERE id = auth.uid()));

-- Sessions Table Policies
DROP POLICY IF EXISTS "mentors_all_sessions" ON public.sessions;
CREATE POLICY "mentors_all_sessions" ON public.sessions FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'mentor'));
DROP POLICY IF EXISTS "everyone_read_sessions" ON public.sessions;
CREATE POLICY "everyone_read_sessions" ON public.sessions FOR SELECT USING (true);

-- Attendance Table Policies
DROP POLICY IF EXISTS "mentors_all_attendance" ON public.attendance;
CREATE POLICY "mentors_all_attendance" ON public.attendance FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'mentor'));
DROP POLICY IF EXISTS "students_read_own_attendance" ON public.attendance;
CREATE POLICY "students_read_own_attendance" ON public.attendance FOR SELECT USING (student_id = (SELECT student_id FROM public.users WHERE id = auth.uid()));

-- Materials Table Policies
DROP POLICY IF EXISTS "mentors_all_materials" ON public.materials;
CREATE POLICY "mentors_all_materials" ON public.materials FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'mentor'));
DROP POLICY IF EXISTS "everyone_read_materials" ON public.materials;
CREATE POLICY "everyone_read_materials" ON public.materials FOR SELECT USING (true);

-- ImportLog Table Policies
DROP POLICY IF EXISTS "mentors_all_import_log" ON public.import_log;
CREATE POLICY "mentors_all_import_log" ON public.import_log FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'mentor'));

-- Users Table Policies
DROP POLICY IF EXISTS "users_read_self" ON public.users;
CREATE POLICY "users_read_self" ON public.users FOR SELECT USING (id = auth.uid());
DROP POLICY IF EXISTS "mentors_read_all_users" ON public.users;
CREATE POLICY "mentors_read_all_users" ON public.users FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'mentor'));

-- 5. Auth Trigger
-- Whenever a student is added to public.students, we don't auto-create the AUTH user here because we need a password.
-- However, we can create a trigger that links them if the auth user is created later, or handles the public.users mapping.
-- The spec says: "Build an auth trigger that auto-creates a public.users row ... whenever a new row is inserted into students."
-- This usually requires an external system to create the Auth user first.
-- Let's stick to the mapping trigger for when an auth user is created.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, display_name)
  VALUES (new.id, new.email, 'student', COALESCE(new.raw_user_meta_data->>'name', new.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users (Supabase handled)
-- Note: This requires running as a superuser or having permissions on auth schema.
-- In Supabase, you usually do:
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
