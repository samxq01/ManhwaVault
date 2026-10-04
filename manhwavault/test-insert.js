import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qetnytanqgrtktwporfo.supabase.co';
const supabaseKey = 'sb_publishable_26jkFnZs6oen-weehAtoLA_CBSUoor7';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  // First, we need to sign in to satisfy RLS
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'password123'
  });

  if (authError) {
    console.error('Auth error:', authError);
    // Let's create the user if they don't exist
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123'
    });
    if (signUpError) {
      console.error('Sign up error:', signUpError);
      return;
    }
  }

  const { data: userResp } = await supabase.auth.getUser();
  if (!userResp.user) {
    console.log('No user');
    return;
  }
  const userId = userResp.user.id;
  console.log('User ID:', userId);

  const testManhwa = {
    title: 'Test',
    alternative_title: null,
    type: 'Manhwa',
    status: 'Reading',
    current_chapter: 1,
    total_chapters: null,
    cover_url: '',
    description: null,
    rating: null,
    notes: null,
    is_favorite: false,
    user_id: userId
  };

  const { data, error } = await supabase.from('manhwa').insert([testManhwa]).select().single();
  
  if (error) {
    console.error('Insert error:', error);
  } else {
    console.log('Insert success:', data);
  }
}

testInsert();
