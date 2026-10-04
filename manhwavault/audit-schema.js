import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qetnytanqgrtktwporfo.supabase.co';
const supabaseKey = 'sb_publishable_26jkFnZs6oen-weehAtoLA_CBSUoor7';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert(payload, testName) {
  const { error, data } = await supabase.from('manhwa').insert([payload]).select();
  console.log(`\nTest: ${testName}`);
  if (error) {
    console.log(`Error: ${error.message}`);
    if (error.details) console.log(`Details: ${error.details}`);
    if (error.hint) console.log(`Hint: ${error.hint}`);
  } else {
    console.log(`Success! Inserted data.`);
    if (data && data[0]) {
      await supabase.from('manhwa').delete().eq('id', data[0].id);
    }
  }
}

async function runAudit() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'password123'
  });
  
  if (authError) {
    console.error('Sign in error:', authError);
    return;
  }
  
  const userId = authData.user.id;

  const base = {
    title: 'Audit Test',
    type: 'manhwa',
    status: 'reading',
    current_chapter: 1,
    user_id: userId
  };

  await testInsert({ ...base, rating: -1 }, "Rating < 0");
  await testInsert({ ...base, rating: 11 }, "Rating > 10");
  
  await testInsert({ ...base, current_chapter: -1 }, "Current Chapter < 0");
  
  await testInsert({ ...base, total_chapters: -1 }, "Total Chapters < 0");
  
  await testInsert({ ...base, title: '' }, "Empty Title");
  await testInsert({ ...base, title: null }, "Null Title");
  
  await testInsert({ ...base, cover_url: 'not-a-url' }, "Invalid Cover URL");
  await testInsert({ ...base, cover_url: '' }, "Empty Cover URL");
  await testInsert({ ...base, cover_url: null }, "Null Cover URL");
  
  await testInsert({ ...base, is_favorite: null }, "Null is_favorite");
  
  await testInsert({ ...base, created_at: 'invalid-date' }, "Invalid Timestamps");
}

runAudit();
