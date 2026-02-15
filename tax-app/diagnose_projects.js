const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrqzesbghxvbhzudqzbs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOnN1cGFiYXNlIiwicmVmIjoibnJxemVzYmdoeHZiaHp1ZHF6YnMiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc3MTA4NjU2NywiZXhwIjoyMDg2NjYyNTY3fQ.dqh1mHHFAL1-7mlUGIs9PxukdvMLwbXWZo8yTObjcPw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log("Checking Project/Transaction consistency...");

    const { data: projects } = await supabase.from('projects').select('*');
    const { data: entries } = await supabase.from('ledger_entries').select('*');

    console.log(`Found ${projects.length} projects and ${entries.length} transactions.`);

    const projectIds = new Set(projects.map(p => p.id));
    const projectNames = new Set(projects.map(p => p.name));

    let orphaned = 0;
    let missingIdButHasName = 0;
    let nameMismatch = 0;

    entries.forEach(e => {
        if (e.project_id && !projectIds.has(e.project_id)) {
            orphaned++;
            console.log(`Orphaned Transaction: ${e.description} (${e.amount}) - ID: ${e.project_id} not in projects table.`);
        }
        if (!e.project_id && e.project_name) {
            missingIdButHasName++;
        }
        if (e.project_id && projectIds.has(e.project_id)) {
            const proj = projects.find(p => p.id === e.project_id);
            if (proj.name !== e.project_name) {
                nameMismatch++;
                console.log(`Name Mismatch: Entry says "${e.project_name}" but Project ID ${e.project_id} is named "${proj.name}"`);
            }
        }
    });

    console.log("\nSummary:");
    console.log(`- Orphaned (Invalid PID): ${orphaned}`);
    console.log(`- Missing PID but has Name: ${missingIdButHasName}`);
    console.log(`- Name mismatches: ${nameMismatch}`);
}

diagnose();
