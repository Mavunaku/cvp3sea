const { createClient } = require('@supabase/supabase-js');

// User credentials (from metadata)
const SUPABASE_URL = 'https://nrqzesbghxvbhzudqzbs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ycXplc2JnaHh2Ymh6dWRxemJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwODY1NjcsImV4cCI6MjA4NjY2MjU2N30.dqh1mHHFAL1-7mlUGIs9PxukdvMLwbXWZo8yTObjcPw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugWrites() {
    console.log("STARTING DEBUG (READ/WRITE CHECK)...");

    const fakeProjectID = 'e0458739-8137-4d6d-8e7c-87d57f86d63e';
    const fakeUserID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    // 2. TRANSACTION INSERT Check
    console.log("Attempting to save Transaction (with project_id)...");
    const { error: transError } = await supabase.from('ledger_entries').upsert([{
        id: '12345678-8137-4d6d-8e7c-87d57f86d63e',
        date: new Date().toISOString(),
        amount: 200,
        type: 'income',
        description: 'Debug Transaction Check 2',
        category: 'Services',
        project_id: fakeProjectID,
        project_name: 'Debug Project',
        user_id: fakeUserID
    }]);

    if (transError) {
        console.error("FAIL: Transaction Save Failed:", JSON.stringify(transError, null, 2));
    } else {
        console.log("SUCCESS: Saved Transaction 'Debug Transaction Check 2'");
    }

    // 3. READ CHECK
    console.log("Reading ledger_entries...");
    const { data, error: readError } = await supabase.from('ledger_entries').select('id, description, amount, project_id, user_id').limit(10);

    if (readError) {
        console.error("READ FAIL:", JSON.stringify(readError, null, 2));
    } else {
        console.log("READ SUCCESS. Found rows:", data.length);
        console.log(JSON.stringify(data, null, 2));
    }
}

debugWrites();
