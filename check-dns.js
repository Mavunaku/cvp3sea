
const dns = require('dns');

console.log('Resolving aws-0-us-east-1.pooler.supabase.com...');
dns.setServers(['8.8.8.8']);
dns.lookup('aws-0-us-east-1.pooler.supabase.com', { family: 4 }, (err, address, family) => {
    if (err) {
        console.error('DNS Error:', err);
    } else {
        console.log('Resolved IPv4:', address);
    }
});
