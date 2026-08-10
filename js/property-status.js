/**
 * CVP Properties 4.0 — Live Property Availability
 * Reads each property's Available/Unavailable status from Supabase (set via
 * the Landlord Toolbox "Modify Properties" tool in the tax app) and updates
 * the badge on each "Our Properties" card to match.
 */
(function () {
    var SUPABASE_URL = 'https://nrqzesbghxvbhzudqzbs.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ycXplc2JnaHh2Ymh6dWRxemJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwODY1NjcsImV4cCI6MjA4NjY2MjU2N30.dqh1mHHFAL1-7mlUGIs9PxukdvMLwbXWZo8yTObjcPw';

    function applyStatus(slug, available) {
        var badges = document.querySelectorAll('[data-property-slug="' + slug + '"] .portfolio-badge.unavailable, [data-property-slug="' + slug + '"] .portfolio-badge.available');
        badges.forEach(function (badge) {
            badge.classList.remove('unavailable', 'available');
            badge.classList.add(available ? 'available' : 'unavailable');
            badge.textContent = available ? 'Available' : 'Unavailable';
        });
    }

    fetch(SUPABASE_URL + '/rest/v1/property_listings?select=slug,available', {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        },
    })
        .then(function (res) { return res.ok ? res.json() : []; })
        .then(function (rows) {
            rows.forEach(function (row) {
                applyStatus(row.slug, row.available);
            });
        })
        .catch(function () {
            // Network hiccup or table not migrated yet — leave the
            // hardcoded "Unavailable" badges in the HTML as the fallback.
        });
})();
