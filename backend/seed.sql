-- Seed data for ForgeTrack

-- 1. Clear existing data (optional but good for clean seed)
TRUNCATE public.attendance, public.materials, public.sessions, public.students, public.import_log RESTART IDENTITY CASCADE;

-- 2. Insert Students (25)
INSERT INTO public.students (name, usn, branch_code, batch) VALUES
('Aarav Sharma', '4SH24CS001', 'CS', '2024-2028'),
('Aditi Iyer', '4SH24CS002', 'CS', '2024-2028'),
('Arjun Reddy', '4SH24AI003', 'AI', '2024-2028'),
('Ananya Kapoor', '4SH24AI004', 'AI', '2024-2028'),
('Bhavya Nair', '4SH24IS005', 'IS', '2024-2028'),
('Chetan Gowda', '4SH24CS006', 'CS', '2024-2028'),
('Deepika Padukone', '4SH24CS007', 'CS', '2024-2028'),
('Eshwar Rao', '4SH24AI008', 'AI', '2024-2028'),
('Fathima Sheikh', '4SH24AI009', 'AI', '2024-2028'),
('Gautam Mehra', '4SH24IS010', 'IS', '2024-2028'),
('Hamsa Bhat', '4SH24CS011', 'CS', '2024-2028'),
('Ishaan Khattar', '4SH24CS012', 'CS', '2024-2028'),
('Jaya Lakshmi', '4SH24AI013', 'AI', '2024-2028'),
('Karthik Raja', '4SH24AI014', 'AI', '2024-2028'),
('Leela Samson', '4SH24IS015', 'IS', '2024-2028'),
('Manoj Bajpayee', '4SH24CS016', 'CS', '2024-2028'),
('Neha Dhupia', '4SH24CS017', 'CS', '2024-2028'),
('Omkar Das', '4SH24AI018', 'AI', '2024-2028'),
('Priya Mani', '4SH24AI019', 'AI', '2024-2028'),
('Quasim Khan', '4SH24IS020', 'IS', '2024-2028'),
('Rohan Mehra', '4SH24CS021', 'CS', '2024-2028'),
('Sanya Malhotra', '4SH24CS022', 'CS', '2024-2028'),
('Tarun Tahiliani', '4SH24AI023', 'AI', '2024-2028'),
('Umesh Yadav', '4SH24AI024', 'AI', '2024-2028'),
('Varun Dhawan', '4SH24IS025', 'IS', '2024-2028');

-- 3. Insert Sessions (15)
INSERT INTO public.sessions (date, topic, month_number, duration_hours, session_type) VALUES
('2026-04-01', 'Introduction to AI-ML Stack', 4, 2.0, 'offline'),
('2026-04-03', 'Python for Data Science', 4, 2.5, 'offline'),
('2026-04-05', 'Vector Databases and Embeddings', 4, 2.0, 'online'),
('2026-04-08', '8-Layer AI Application Stack', 4, 3.0, 'offline'),
('2026-04-10', 'Large Language Models Foundations', 4, 2.0, 'offline'),
('2026-04-12', 'Prompt Engineering Patterns', 5, 2.0, 'offline'),
('2026-04-15', 'ReAct Agent Pattern', 5, 2.5, 'offline'),
('2026-04-17', 'pgvector RAG Implementation', 5, 2.0, 'online'),
('2026-04-20', 'Tiered Autonomy Multi-Agent Systems', 5, 3.0, 'offline'),
('2026-04-22', 'Model Fine-tuning Basics', 5, 2.0, 'offline'),
('2026-04-24', 'Evaluation Frameworks for AI', 6, 2.0, 'offline'),
('2026-04-26', 'Deployment of AI Apps', 6, 2.5, 'offline'),
('2026-04-28', 'Monitoring and Observability', 6, 2.0, 'online'),
('2026-04-29', 'Ethics and Safety in AI', 6, 3.0, 'offline'),
('2026-04-30', 'Capstone Project Kickoff', 6, 2.0, 'offline');

-- 4. Insert Attendance (Realistic distribution)
-- We'll just mark everyone present for the first session, then introduce some absences.
INSERT INTO public.attendance (student_id, session_id, present, marked_by)
SELECT s.id, ses.id, (random() > 0.15), 'seed_script'
FROM public.students s
CROSS JOIN public.sessions ses;

-- 5. Insert Materials
INSERT INTO public.materials (session_id, title, type, url, description) VALUES
(1, 'Course Introduction Slides', 'slides', 'https://docs.google.com/presentation/d/1', 'Overview of the bootcamp'),
(1, 'Session Recording', 'recording', 'https://youtube.com/watch?v=1', 'First day session video'),
(4, '8-Layer AI Stack Diagram', 'document', 'https://drive.google.com/file/d/4', 'High-level architecture diagram'),
(7, 'Agent Patterns Implementation', 'link', 'https://github.com/theforge/agent-patterns', 'Sample code for ReAct');

-- 6. Insert Mentor (Nischay)
-- Note: We need a UUID from auth.users. This seed script won't work perfectly for public.users 
-- unless we know the UUIDs. We'll leave placeholders or add them manually after auth setup.
-- For now, we can insert a dummy mentor if we skip the FK check or if we are just testing schema.
