
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrqzesbghxvbhzudqzbs.supabase.co';
// Using the verified JWT Anon Key
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ycXplc2JnaHh2Ymh6dWRxemJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwODY1NjcsImV4cCI6MjA4NjY2MjU2N30.dqh1mHHFAL1-7mlUGIs9PxukdvMLwbXWZo8yTObjcPw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    const email = 'admin@example.com';
    const password = 'admin123';

    // SKIP AUTH (Because we know RLS is disabled and Auth fails rate limit)
    const userIdToUse = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    console.log("Skipping Auth. Using Static UUID:", userIdToUse);

    console.log("Attempting to insert test record...");

    const helper_id = 'e0458739-8137-4d6d-8e7c-87d57f86d63e'; // Valid UUID
    const user_id = userIdToUse; // Use the authenticated user's ID

    const payload = {
        id: helper_id, // Use same ID to test upsert
        date: new Date().toISOString(),
        amount: 150.00,
        type: 'expense',
        // entity: 'Test Entity', // Removed
        description: 'Test Expense via Script',
        category: 'Office Supplies',
        // status: 'completed', // Removed
        user_id: user_id, // UUID
        project_name: 'General'
    };

    const { data, error } = await supabase
        .from('ledger_entries')
        .insert([payload]) // Changed from testRecord to payload
        .select();

    if (error) {
        console.error("INSERT FAILED:");
        console.error(JSON.stringify(error, null, 2));
    } else {
        console.log("INSERT SUCCESS:");
        console.log(data);
    }
}

testInsert();
