/**
 * End-to-end Supabase flow test for the Tax Ledger.
 *
 * Run this on a machine WITH internet access (the app sandbox has none):
 *   cd tax-app
 *   node test-supabase-flow.js
 *
 * It exercises the full round-trip for every table the app uses — years,
 * projects, ledger_entries (transactions), assets (incl. the new depreciation
 * config + sale/capital-gains columns), and members — by writing a temporary
 * TEST record to each, reading it back, verifying the values survived, then
 * deleting it. It tells you exactly which migrations (if any) still need to run.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nrqzesbghxvbhzudqzbs.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ycXplc2JnaHh2Ymh6dWRxemJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwODY1NjcsImV4cCI6MjA4NjY2MjU2N30.dqh1mHHFAL1-7mlUGIs9PxukdvMLwbXWZo8yTObjcPw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Isolated test identity so we never touch real data.
const TEST_USER = 'FLOW_TEST_USER_' + Date.now();
const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
});

const ok = (m) => console.log('  \x1b[32m✓\x1b[0m ' + m);
const bad = (m) => console.log('  \x1b[31m✗\x1b[0m ' + m);

let passed = 0, failed = 0;
function check(cond, label) { if (cond) { ok(label); passed++; } else { bad(label); failed++; } }

async function run() {
    console.log(`\nSupabase flow test → ${SUPABASE_URL}`);
    console.log(`Test user: ${TEST_USER}\n`);

    const yearId = String(2000 + Math.floor(Math.random() * 100));
    const projectId = uuid();
    const txId = uuid();
    const assetId = uuid();
    const memberId = uuid();

    // 1) YEARS
    console.log('years:');
    {
        const { error } = await supabase.from('years').insert([{ id: yearId, user_id: TEST_USER }]);
        check(!error, `insert year ${yearId}` + (error ? ` — ${error.message}` : ''));
        const { data } = await supabase.from('years').select('*').eq('user_id', TEST_USER);
        check(data && data.length === 1, 'read year back');
    }

    // 2) PROJECTS
    console.log('projects:');
    {
        const { error } = await supabase.from('projects').insert([{ id: projectId, name: 'FLOW TEST Property', type: 'Property', year_id: yearId, user_id: TEST_USER }]);
        check(!error, 'insert project' + (error ? ` — ${error.message}` : ''));
        const { data } = await supabase.from('projects').select('*').eq('id', projectId);
        check(data && data[0] && data[0].name === 'FLOW TEST Property', 'read project back');
    }

    // 3) LEDGER ENTRIES (transactions)
    console.log('ledger_entries (transactions):');
    {
        const { error } = await supabase.from('ledger_entries').insert([{
            id: txId, date: '2026-01-15', amount: 1234.56, type: 'expense',
            description: 'FLOW TEST expense', category: 'Roof', status: 'Cleared',
            project_id: projectId, project_name: 'FLOW TEST Property', user_id: TEST_USER,
            ny_source: true, pillar: 'Repairs', capitalize: true,
        }]);
        check(!error, 'insert transaction' + (error ? ` — ${error.message}` : ''));
        const { data } = await supabase.from('ledger_entries').select('*').eq('id', txId);
        check(data && data[0] && Number(data[0].amount) === 1234.56, 'amount round-trips');
        check(data && data[0] && data[0].capitalize === true, 'capitalize flag round-trips');
    }

    // 4) ASSETS (incl. new config + sale columns)
    console.log('assets (config + capital-gains columns):');
    {
        const full = {
            id: assetId, name: 'FLOW TEST Building', type: 'Property Improvement',
            purchase_date: '2019-01-01', cost: 200000, land: 40000,
            business_use_percent: 100, useful_life: 27.5, section_179: false, bonus_depreciation: false,
            prior_depreciation: 30000, current_depreciation: null, method: 'MACRS', convention: 'MM',
            sale_date: '2026-09-01', sale_price: 320000, selling_costs: 20000,
            project_id: projectId, user_id: TEST_USER,
        };
        const { error } = await supabase.from('assets').insert([full]);
        if (error && error.code === '42703') {
            bad(`assets is missing newer columns (${error.message})`);
            console.log('    → RUN: supabase_migration_asset_fields.sql AND supabase_migration_asset_disposition.sql');
            failed++;
        } else {
            check(!error, 'insert asset with all columns' + (error ? ` — ${error.message}` : ''));
            const { data } = await supabase.from('assets').select('*').eq('id', assetId);
            const a = data && data[0];
            check(a && Number(a.business_use_percent) === 100, 'business_use_percent round-trips (asset-fields migration)');
            check(a && Number(a.useful_life) === 27.5, 'useful_life round-trips');
            check(a && a.section_179 === false, 'section_179 round-trips');
            check(a && a.sale_date === '2026-09-01', 'sale_date round-trips (disposition migration)');
            check(a && Number(a.sale_price) === 320000, 'sale_price round-trips');
            check(a && Number(a.selling_costs) === 20000, 'selling_costs round-trips');
        }
    }

    // 5) MEMBERS
    console.log('members (K-1):');
    {
        const { error } = await supabase.from('members').insert([{ id: memberId, name: 'FLOW TEST Partner', ownership_percent: 50, user_id: TEST_USER }]);
        if (error && (error.code === '42P01' || error.code === '42703')) {
            bad(`members table not ready (${error.message})`);
            console.log('    → RUN: supabase_migration_members.sql');
            failed++;
        } else {
            check(!error, 'insert member' + (error ? ` — ${error.message}` : ''));
            const { data } = await supabase.from('members').select('*').eq('id', memberId);
            check(data && data[0] && Number(data[0].ownership_percent) === 50, 'ownership_percent round-trips');
        }
    }

    // 6) CLEANUP — delete everything this test created
    console.log('cleanup:');
    await supabase.from('ledger_entries').delete().eq('user_id', TEST_USER);
    await supabase.from('assets').delete().eq('user_id', TEST_USER);
    await supabase.from('members').delete().eq('user_id', TEST_USER);
    await supabase.from('projects').delete().eq('user_id', TEST_USER);
    await supabase.from('years').delete().eq('user_id', TEST_USER);
    const { data: leftover } = await supabase.from('projects').select('id').eq('user_id', TEST_USER);
    check(!leftover || leftover.length === 0, 'test data cleaned up');

    console.log(`\n${failed === 0 ? '\x1b[32mALL PASSED' : '\x1b[31mSOME FAILED'}\x1b[0m — ${passed} passed, ${failed} failed\n`);
    process.exit(failed === 0 ? 0 : 1);
}

run().catch((e) => { console.error('\nFATAL:', e.message); process.exit(1); });
