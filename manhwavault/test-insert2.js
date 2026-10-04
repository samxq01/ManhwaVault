import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qetnytanqgrtktwporfo.supabase.co';
const supabaseKey = 'sb_publishable_26jkFnZs6oen-weehAtoLA_CBSUoor7';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const email = `test-${Date.now()}@example.com`;
  const password = 'password123';
  
  console.log('Registering user:', email);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  });
  
  if (signUpError) {
    console.error('Sign up error:', signUpError);
    return;
  }

  const userId = signUpData.user.id;
  console.log('User ID:', userId);

  const testManhwa = {
    title: 'Test Title',
    alternative_title: null,
    type: 'Manhwa',
    status: 'Reading',
    current_chapter: 1,
    total_chapters: null,
    cover_url: null,
    description: null,
    rating: null,
    notes: null,
    is_favorite: false,
    user_id: userId
  };

  console.log('Attempting insert with nulls...');
  const { data, error } = await supabase.from('manhwa').insert([testManhwa]).select().single();
  
  if (error) {
    console.error('Insert error with nulls:', error);
  } else {
    console.log('Insert success with nulls:', data);
  }

  const testManhwaEmptyStrings = {
    title: 'Test Title 2',
    alternative_title: '',
    type: 'Manhwa',
    status: 'Reading',
    current_chapter: 1,
    total_chapters: null,
    cover_url: '',
    description: '',
    rating: null,
    notes: '',
    is_favorite: false,
    user_id: userId
  };

  console.log('Attempting insert with empty strings...');
  const { data: data2, error: error2 } = await supabase.from('manhwa').insert([testManhwaEmptyStrings]).select().single();
  
  if (error2) {
    console.error('Insert error with empty strings:', error2);
  } else {
    console.log('Insert success with empty strings:', data2);
  }
}

testInsert();
