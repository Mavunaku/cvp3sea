const { Client } = require('pg');

// Pooler Connection
const config = {
    user: 'postgres.nrqzesbghxvbhzudqzbs', // User.ProjectRef
    host: 'aws-0-us-east-1.pooler.supabase.com',
    database: 'postgres',
    password: '$N_fKR2vr6j%%W', // Trying literal %% first
    port: 6543, // Pooler port
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000 // 10s timeout
};

const client = new Client(config);

async function fixDatabase() {
    try {
        await client.connect();
        console.log('Connected to Supabase Postgres!');

        // 1. Inspect Schema
        console.log('\n--- Inspecting ledger_entries Schema ---');
        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ledger_entries';
    `);

        if (res.rows.length === 0) {
            console.error('TABLE ledger_entries DOES NOT EXIST!');
        } else {
            console.log('Columns found:', res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
        }

        // 2. Fix RLS Policy
        console.log('\n--- Fixing RLS Policy ---');

        // Check if RLS is enabled
        // Actually, user wants "allow anon role to insert/select".
        // We can do this safely by:
        // A) DROP POLICY IF EXISTS "Allow Anon All" ON ledger_entries;
        // B) CREATE POLICY "Allow Anon All" ON ledger_entries FOR ALL TO anon USING (true) WITH CHECK (true);
        // C) GRANT ALL ON ledger_entries TO anon; (Also important!)

        await client.query(`
      ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow Anon All" ON ledger_entries;
      CREATE POLICY "Allow Anon All" ON ledger_entries FOR ALL TO anon USING (true) WITH CHECK (true);
      GRANT ALL ON ledger_entries TO anon;
      GRANT ALL ON SEQUENCE ledger_entries_id_seq TO anon; -- Grant sequence access if serial
    `);

        console.log('RLS Policy "Allow Anon All" created and permissions granted to anon role.');

        // Also do the same for projects and assets just in case
        console.log('\n--- Applying fixes to projects and assets tables too ---');
        await client.query(`
      ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow Anon All" ON projects;
      CREATE POLICY "Allow Anon All" ON projects FOR ALL TO anon USING (true) WITH CHECK (true);
      GRANT ALL ON projects TO anon;

      ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow Anon All" ON assets;
      CREATE POLICY "Allow Anon All" ON assets FOR ALL TO anon USING (true) WITH CHECK (true);
      GRANT ALL ON assets TO anon;
    `);
        console.log('Permissions updated for projects and assets.');

    } catch (err) {
        console.error('Database Error:', err);
    } finally {
        await client.end();
    }
}

fixDatabase();
