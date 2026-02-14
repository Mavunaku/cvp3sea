const { createClient } = require('@supabase/supabase-js');

// User credentials
const SUPABASE_URL = 'https://nrqzesbghxvbhzudqzbs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ycXplc2JnaHh2Ymh6dWRxemJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwODY1NjcsImV4cCI6MjA4NjY2MjU2N30.dqh1mHHFAL1-7mlUGIs9PxukdvMLwbXWZo8yTObjcPw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkData() {
    console.log("Checking DB for recent entries...");
    const { data, error } = await supabase
        .from('ledger_entries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("FAIL:", JSON.stringify(error, null, 2));
    } else {
        console.log("SUCCESS. Recent entries:");
        console.log(JSON.stringify(data, null, 2));
    }
}

checkData();
