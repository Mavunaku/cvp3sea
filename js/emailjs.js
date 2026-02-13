/**
 * CVP Properties 4.0 — EmailJS Form Handler
 * Handles the unified "Request & Schedule" form across all pages.
 * Credentials provided: 
 * Service ID: service_sdhb5mi
 * Template ID: template_kti6qzr
 * Public Key: qXZyOoWHJJBUAo64B
 */

// ---- Show confirmation message ----
function showConfirmation() {
    const confirmEl = document.getElementById("form-confirmation");
    if (confirmEl) {
        confirmEl.classList.add("show");
        setTimeout(() => {
            confirmEl.classList.remove("show");
        }, 6000); // Auto-hide after 6 seconds
    }
}

// ---- Handle "Request & Schedule" form submission (index.html, todo.html) ----
function handleRequestSchedule() {
    const nameEl = document.getElementById("rs-name");
    const emailEl = document.getElementById("rs-email");
    const phoneEl = document.getElementById("rs-phone");
    const dateEl = document.getElementById("rs-date");
    const timeEl = document.getElementById("rs-time");
    const messageEl = document.getElementById("rs-message");

    if (!nameEl || !emailEl) return;

    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    const phone = phoneEl ? phoneEl.value.trim() : "";
    const date = dateEl ? dateEl.value : "";
    const time = timeEl ? timeEl.value : "";
    const message = messageEl ? messageEl.value.trim() : "";

    // ---- Validation ----
    if (!name || !email) {
        alert("Please provide at least your name and email address.");
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    // ---- EmailJS integration ----
    const serviceId = "service_sdhb5mi";
    const templateId = "template_kti6qzr";

    const templateParams = {
        name: name,
        email: email,
        phone: phone || "(not provided)",
        tour_date: date || "(not selected)",
        tour_time: time || "(not selected)",
        message: message || "(no message)"
    };

    console.log("EmailJS Sending:", templateParams);

    emailjs.send(serviceId, templateId, templateParams)
        .then(res => {
            console.log("EmailJS Success:", res);
            showConfirmation();

            // ---- Clear form fields ----
            nameEl.value = "";
            emailEl.value = "";
            if (phoneEl) phoneEl.value = "";
            if (dateEl) dateEl.value = "";
            if (timeEl) timeEl.value = "";
            if (messageEl) messageEl.value = "";
        })
        .catch(err => {
            console.error("EmailJS error:", err);
            alert("Something went wrong. Please try again or call us directly.");
        });
}

// ---- Handle Property Page forms (sendMail function) ----
function sendMail() {
    const nameEl = document.getElementById("name");
    const emailEl = document.getElementById("email");
    const interestEl = document.getElementById("interest");
    const messageEl = document.getElementById("message");

    if (!nameEl || !emailEl) return;

    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    const interest = interestEl ? interestEl.value : "info";
    const message = messageEl ? messageEl.value.trim() : "";

    // ---- Validation ----
    if (!name || !email) {
        alert("Please provide your name and email address.");
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    const serviceId = "service_sdhb5mi";
    const templateId = "template_kti6qzr";

    // Map property page fields to template params
    const templateParams = {
        name: name,
        email: email,
        phone: "(not provided)",
        tour_date: interest === "tour" ? "(ASAP - Tour requested)" : "(General Inquiry)",
        tour_time: interest, // Using interest field to provide context in time slot
        message: message || "(no message)"
    };

    console.log("EmailJS Sending (Property Page):", templateParams);

    emailjs.send(serviceId, templateId, templateParams)
        .then(res => {
            console.log("EmailJS Success:", res);
            showConfirmation();

            // ---- Clear form fields ----
            nameEl.value = "";
            emailEl.value = "";
            if (messageEl) messageEl.value = "";
        })
        .catch(err => {
            console.error("EmailJS error:", err);
            alert("Something went wrong. Please try again or call us directly.");
        });
}
