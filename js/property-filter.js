/**
 * CVP Properties 4.0 — Property Filter Logic
 * Handles the search functionality on the homepage hero section.
 */

// Static Dataset of Properties
const rentals = [
    {
        id: 1,
        title: "67 Grand Blvd., Apt 1",
        location: "Binghamton",
        area: "West Side",
        bedrooms: 3,
        bathrooms: 2,
        url: "/67GrandBLVD.html",
        image: "img/portfolio/fl1Grand.jpg",
        status: "Unavailable",
        description: "Heart of Binghamton: 3-bed, 2 baths"
    },
    {
        id: 2,
        title: "67 Grand Blvd., Apt 2",
        location: "Binghamton",
        area: "West Side",
        bedrooms: 3,
        bathrooms: 2,
        url: "/67GrandBLVD2FL.html",
        image: "img/portfolio/2ndflGrand.jpg",
        status: "Unavailable",
        description: "Heart of Binghamton: 3-bed, 2 baths"
    },
    {
        id: 3,
        title: "15 Orchard Ave., Apt 1",
        location: "Johnson City",
        area: "Johnson City",
        bedrooms: 2,
        bathrooms: 1,
        url: "/15OrchardAve.html",
        image: "img/portfolio/item.jpg",
        status: "Unavailable",
        description: "Embrace Tranquility: 2-beds, 1-bath"
    },
    {
        id: 4,
        title: "15 Orchard Ave., Apt 2, 2FL",
        location: "Johnson City",
        area: "Johnson City",
        bedrooms: 2,
        bathrooms: 1,
        url: "/15OrchardAve2fl.html",
        image: "img/portfolio/item.jpg",
        status: "Unavailable",
        description: "Embrace Tranquility: 2-beds, 1-bath"
    },
    {
        id: 5,
        title: "Garden View Apt. — Greek Peak",
        location: "Greek Peak",
        area: "Mountain Resort",
        bedrooms: 2,
        bathrooms: 1,
        url: "/2112KypriotisDr1FL.html",
        image: "img/portfolio/3.jpg",
        status: "Unavailable",
        description: "Mountain Resort: 2-bed, 1 bath — Ski, Swim, Enjoy!"
    }
];

/**
 * Handle Search Button Click
 */
function handlePropertySearch() {
    const area = document.getElementById('search-area').value;
    const bedrooms = document.getElementById('search-bedrooms').value;
    const submitBtn = document.getElementById('search-submit');
    const resultsSection = document.getElementById('results-section');
    const container = document.getElementById('property-results-container');
    const noResults = document.getElementById('no-results');
    const countText = document.getElementById('results-count');

    // 1. Show Loading State
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Searching...";
    submitBtn.disabled = true;

    setTimeout(() => {
        // 2. Filter Logic
        let filteredRentals = rentals.filter(item => {
            const matchArea = (area === 'all' || item.location === area);

            let matchBedrooms = true;
            if (bedrooms !== 'any') {
                if (bedrooms === '4+') {
                    matchBedrooms = item.bedrooms >= 4;
                } else {
                    matchBedrooms = item.bedrooms === parseInt(bedrooms);
                }
            }

            return matchArea && matchBedrooms;
        });

        // 3. Update UI
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
        resultsSection.style.display = "block";
        container.innerHTML = "";

        if (filteredRentals.length > 0) {
            noResults.style.display = "none";
            countText.innerText = `Found ${filteredRentals.length} property matching your criteria`;

            filteredRentals.forEach(rental => {
                const card = createPropertyCard(rental);
                container.appendChild(card);
            });
        } else {
            noResults.style.display = "block";
            countText.innerText = "0 matches found";
        }

        // 4. Scroll to Results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    }, 400); // 400ms Fake Loading
}

/**
 * Create HTML Card for a Property
 */
function createPropertyCard(rental) {
    const li = document.createElement('li');
    li.className = "portfolio-item wow animated fadeInUp";
    li.style.visibility = "visible"; // Ensure it shows up if WOW isn't triggered

    // Status color
    const statusColor = rental.status === "Available" ? "#5cc4b8" : "#ff6b6b";

    li.innerHTML = `
        <a href="${rental.url}">
            <img src="${rental.image}" class="img-responsive" alt="${rental.title}">
        </a>
        <figcaption class="mask">
            <h3>${rental.title}</h3>
            <p>${rental.description}</p>
            <p style="color: ${statusColor}; font-weight: 700;">${rental.status}</p>
            <a href="${rental.url}" class="card-btn-overlay" style="display:none;">View Details</a>
        </figcaption>
    `;

    return li;
}

/**
 * Reset all filters and hide results
 */
function resetFilters() {
    document.getElementById('search-area').value = 'all';
    document.getElementById('search-bedrooms').value = 'any';
    document.getElementById('results-section').style.display = "none";
    document.getElementById('property-results-container').innerHTML = "";

    // Scroll back to top of hero
    document.getElementById('luxury-hero').scrollIntoView({ behavior: 'smooth' });
}
