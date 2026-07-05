const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

async function runMigrations() {
  console.log('=== Supabase Migration Runner ===\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (migrationFiles.length === 0) {
    console.log('No migration files found.');
    return;
  }

  for (const file of migrationFiles) {
    console.log(`Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    const { error } = await supabase.rpc('exec_sql', { sql_text: sql }).single();

    if (error) {
      // If exec_sql RPC doesn't exist, run directly via API
      console.log(`  Note: Direct SQL execution may require Supabase dashboard or CLI.`);
      console.log(`  SQL file content saved at: ${path.join(MIGRATIONS_DIR, file)}`);
      console.log(`  Please run this migration manually in the Supabase SQL Editor.\n`);
    } else {
      console.log(`  Migration ${file} applied successfully.`);
    }
  }

  console.log('\n=== Migrations Complete ===');
}

runMigrations().catch(console.error);
