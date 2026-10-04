const fs = require('fs');

async function run() {
  const res = await fetch('https://qetnytanqgrtktwporfo.supabase.co/rest/v1/', {
    headers: {
      'apikey': 'sb_publishable_26jkFnZs6oen-weehAtoLA_CBSUoor7'
    }
  });
  const data = await res.json();
  fs.writeFileSync('schema.json', JSON.stringify(data, null, 2));
}

run();
