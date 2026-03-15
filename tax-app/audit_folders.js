const URL = 'https://nrqzesbghxvbhzudqzbs.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ycXplc2JnaHh2Ymh6dWRxemJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwODY1NjcsImV4cCI6MjA4NjY2MjU2N30.dqh1mHHFAL1-7mlUGIs9PxukdvMLwbXWZo8yTObjcPw';

async function audit() {
    try {
        const h = { 
            'apikey': KEY, 
            'Authorization': 'Bearer ' + KEY,
            'Content-Type': 'application/json'
        };
        
        console.log('Fetching data from Supabase...');
        const [projects, transactions, assets] = await Promise.all([
            fetch(`${URL}/rest/v1/projects?select=*`, { headers: h }).then(r => r.json()),
            fetch(`${URL}/rest/v1/ledger_entries?select=*`, { headers: h }).then(r => r.json()),
            fetch(`${URL}/rest/v1/assets?select=*`, { headers: h }).then(r => r.json())
        ]);

        console.log('Projects Response Type:', Array.isArray(projects) ? 'Array' : typeof projects);
        console.log('Transactions Response Type:', Array.isArray(transactions) ? 'Array' : typeof transactions);
        console.log('Assets Response Type:', Array.isArray(assets) ? 'Array' : typeof assets);

        if (!Array.isArray(transactions)) {
            console.error('Transactions Error:', transactions);
            return;
        }

        console.log('\n--- MULTI-FOLDER AUDIT REPORT ---\n');
        
        projects.forEach(p => {
            const pTrans = transactions.filter(t => t.project_id === p.id);
            const pAssets = assets.filter(a => a.project_id === p.id);
            
            // 1. Capitalized Repairs
            const capRepairs = pTrans.filter(t => t.capitalize === true);
            const capSum = capRepairs.reduce((acc, t) => acc + (t.amount || 0), 0);
            const capDepr = Math.round(capSum / 27.5); // Standard real estate improvement life
            
            // 2. Assets (Depreciation)
            const assetDepr = pAssets.reduce((acc, a) => {
                const businessUse = (a.business_use_percent || 100) / 100;
                const basis = (a.cost || 0) * businessUse;
                const life = a.useful_life || 1;
                
                if (a.current_depreciation !== undefined && a.current_depreciation !== null) {
                    return acc + a.current_depreciation;
                }
                return acc + Math.round(basis / life);
            }, 0);

            // 3. Special Splits (Interest/Principal)
            const interestItems = pTrans.filter(t => t.pillar === 'Interest Expense');
            const totalInterestAmount = interestItems.reduce((acc, t) => acc + (t.amount || 0), 0);
            const deductibleInterest = interestItems.reduce((acc, t) => {
                if (t.interest !== undefined) return acc + t.interest;
                if (t.category === 'Loan Principal') return acc;
                return acc + t.amount;
            }, 0);
            const interestGap = totalInterestAmount - deductibleInterest;

            // 4. Meals (50% Deduction)
            const mealItems = pTrans.filter(t => 
                t.pillar === 'Travels' && 
                (t.category.includes('(50% Deductible)') || t.description.toLowerCase().includes('meal'))
            );
            const totalMealAmount = mealItems.reduce((acc, t) => acc + (t.amount || 0), 0);
            const deductibleMeals = totalMealAmount * 0.5;
            const mealGap = totalMealAmount - deductibleMeals;

            const totalGap = capDepr + assetDepr + interestGap + mealGap;
            
            console.log(`Folder: ${p.name} (${p.year_id})`);
            console.log(`  - Ledger Total Gap (Deductible vs Sum): $${totalGap.toFixed(2)}`);
            if (capSum > 0) console.log(`    * From Capitalized Repairs: $${capSum.toLocaleString()} (+$${capDepr} depr)`);
            if (assetDepr > 0) console.log(`    * From Asset Depreciation: $${assetDepr.toLocaleString()}`);
            if (interestGap > 0) console.log(`    * From Principal Payments: $${interestGap.toLocaleString()}`);
            if (mealGap > 0) console.log(`    * From Non-Deductible Meals: $${mealGap.toLocaleString()}`);
            
            if (totalGap === 0) {
                console.log('    (No calculation gaps found)');
            }
            console.log('');
        });
        
        console.log('-----------------------------------');
        console.log('Audit complete. All gaps have been identified.');
    } catch (e) {
        console.error('Audit failed:', e.message);
    }
}
audit();
