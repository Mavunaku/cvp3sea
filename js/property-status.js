/**
 * CVP Properties 4.0 — Live Property Listing Data
 * Reads each property's Available/Unavailable status, card heading, and
 * card description from Supabase (set via the Landlord Toolbox "Modify
 * Properties" tool in the tax app) and updates the matching "Our Properties"
 * card to match.
 */
(function () {
    var SUPABASE_URL = 'https://nrqzesbghxvbhzudqzbs.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ycXplc2JnaHh2Ymh6dWRxemJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwODY1NjcsImV4cCI6MjA4NjY2MjU2N30.dqh1mHHFAL1-7mlUGIs9PxukdvMLwbXWZo8yTObjcPw';

    function applyListing(row) {
        var cards = document.querySelectorAll('[data-property-slug="' + row.slug + '"]');
        cards.forEach(function (card) {
            var badges = card.querySelectorAll('.portfolio-badge.unavailable, .portfolio-badge.available');
            badges.forEach(function (badge) {
                badge.classList.remove('unavailable', 'available');
                badge.classList.add(row.available ? 'available' : 'unavailable');
                badge.textContent = row.available ? 'Available' : 'Unavailable';
            });

            if (row.heading) {
                var heading = card.querySelector('.portfolio-body h3');
                if (heading) heading.textContent = row.heading;
            }

            if (row.description) {
                var description = card.querySelector('.portfolio-body p');
                if (description) description.textContent = row.description;
            }
        });
    }

    fetch(SUPABASE_URL + '/rest/v1/property_listings?select=slug,available,heading,description', {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        },
    })
        .then(function (res) { return res.ok ? res.json() : []; })
        .then(function (rows) {
            rows.forEach(applyListing);
        })
        .catch(function () {
            // Network hiccup or table not migrated yet — leave the
            // hardcoded badge/heading/description in the HTML as the fallback.
        });
})();
