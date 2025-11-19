function sendMail() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();

    // ---- VALIDATION ----
    if (!name || !email || !message) {
        alert("All fields are required.");
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        alert("Enter a valid email address.");
        return;
    }

    // ---- READY TO SEND ----
    const params = {
        name: name,
        email: email,
        message: message
    };

    const serviceId = "service_sdhb5mi";
    const templateId = "template_kti6qzr";

    emailjs.send(serviceId, templateId, params)
        .then(res => {
            document.getElementById("name").value = "";
            document.getElementById("email").value = "";
            document.getElementById("message").value = "";
            alert("Your message sent successfully!");
        })
        .catch(err => console.log(err));
}
