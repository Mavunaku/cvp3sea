const { createClient } = require('@supabase/supabase-js');

// User credentials (from metadata)
const SUPABASE_URL = 'https://nrqzesbghxvbhzudqzbs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ycXplc2JnaHh2Ymh6dWRxemJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwODY1NjcsImV4cCI6MjA4NjY2MjU2N30.dqh1mHHFAL1-7mlUGIs9PxukdvMLwbXWZo8yTObjcPw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugFullSchema() {
    console.log("STARTING FULL SCHEMA CHECK...");

    const fakeProjectID = 'e0458739-8137-4d6d-8e7c-87d57f86d63e'; // Valid Project ID (from debug run)
    const fakeUserID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    console.log("Attempting to save Transaction with ALL fields...");
    const { error: transError } = await supabase.from('ledger_entries').upsert([{
        id: '99999999-8137-4d6d-8e7c-87d57f86d63e',
        date: new Date().toISOString(),
        amount: 50.5,
        type: 'expense',
        description: 'Schema Test Transaction',
        category: 'Services',
        project_id: fakeProjectID,
        project_name: 'Debug Project',
        user_id: fakeUserID,

        // Optional Fields that might be causing errors
        capitalize: true,
        pillar: 'Travels',
        ny_source: true,
        interest: 12.34
    }]);

    if (transError) {
        console.error("FAIL: Transaction Save Failed:", JSON.stringify(transError, null, 2));
    } else {
        console.log("SUCCESS: Saved Transaction 'Schema Test Transaction'");
    }
}

debugFullSchema();
