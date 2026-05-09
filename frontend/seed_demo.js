import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yoyyjeiuyhpdfuhoqgfj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlveXlqZWl1eWhwZGZ1aG9xZ2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTIyMDIsImV4cCI6MjA5MjY4ODIwMn0.s0BNsH0WFpxk0poIwyTZO44K8qGEwE8otvSi_UMn52I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function seed() {
  console.log('--- STARTING DEMO SEED ---');

  // 1. Create Demo Mentor Auth User
  const email = 'mentor@forgetrack.com';
  const password = 'Mentor@123';
  
  console.log(`[1/5] Checking/Creating Auth user: ${email}`);
  let userId;

  // Try sign in first
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  
  if (signInData?.user) {
    console.log('Auth user already exists, logged in.');
    userId = signInData.user.id;
  } else {
    console.log('User not found or login failed, attempting signup...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'mentor',
          display_name: 'Demo Mentor'
        }
      }
    });

    if (authError) {
      console.error('Signup failed:', authError.message);
    } else {
      userId = authData?.user?.id;
      console.log('Auth signup successful.');
    }
  }

  if (userId) {
    console.log(`[2/5] Inserting/Updating profile for: ${userId}`);
    await supabase.from('users').upsert({
      id: userId,
      email: email,
      role: 'mentor',
      display_name: 'Demo Mentor'
    });
  }

  // 3. Create Demo Students
  console.log('[3/5] Seeding students...');
  const students = [
    { name: 'Akash Jain',    usn: '4SH24CS001', branch_code: 'CS', batch: '2024-2028' },
    { name: 'Bhavna Rao',    usn: '4SH24CS002', branch_code: 'CS', batch: '2024-2028' },
    { name: 'Chetan Kumar',  usn: '4SH24CS003', branch_code: 'CS', batch: '2024-2028' }
  ];

  for (const s of students) {
    const { data, error } = await supabase.from('students').upsert(s, { onConflict: 'usn' }).select('id').single();
    if (error) console.error(`Error seeding student ${s.name}:`, error.message);
    s.id = data?.id;
  }

  // 4. Create Demo Session
  console.log('[4/5] Seeding session...');
  const { data: sessionData, error: sessionError } = await supabase.from('sessions').upsert({
    topic: 'Productionizing ML Models',
    date: new Date().toISOString().split('T')[0],
    duration_hours: 2,
    session_type: 'offline'
  }).select('id').single();

  if (sessionError) console.error('Error seeding session:', sessionError.message);
  const sessionId = sessionData?.id;

  // 5. Create Demo Attendance
  if (sessionId) {
    console.log('[5/5] Seeding attendance...');
    const attendance = [
      { student_id: students[0].id, session_id: sessionId, present: true,  marked_by: 'seed' },
      { student_id: students[1].id, session_id: sessionId, present: false, marked_by: 'seed' },
      { student_id: students[2].id, session_id: sessionId, present: true,  marked_by: 'seed' }
    ];

    for (const a of attendance) {
      if (a.student_id) {
        const { error } = await supabase.from('attendance').upsert(a, { onConflict: 'student_id,session_id' });
        if (error) console.error(`Error seeding attendance for student ${a.student_id}:`, error.message);
      }
    }
  }

  console.log('--- DEMO SEED COMPLETE ---');
}

seed();
