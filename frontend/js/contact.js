const CONTACT_API_URL = "http://localhost:5000/api/contact";

document.addEventListener("DOMContentLoaded", () => {
    const contactForm = document.getElementById("contactForm");
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");

    menuToggle?.addEventListener("click", () => {
        navLinks?.classList.toggle("show");
    });

    updateCartCount();
    updateAuthNavigation();

    if (!contactForm) {
        console.error("contactForm not found");
        return;
    }

    contactForm.addEventListener("submit", submitContactForm);
});

async function submitContactForm(event) {
    event.preventDefault();

    const submitButton =
        document.getElementById("contactSubmitButton");

    const formMessage =
        document.getElementById("contactFormMessage");

    const name =
        document.getElementById("contactName").value.trim();

    const email =
        document.getElementById("contactEmail").value.trim();

    const phone =
        document.getElementById("contactPhone").value.trim();

    const subject =
        document.getElementById("contactSubject").value;

    const message =
        document.getElementById("contactMessage").value.trim();

    formMessage.textContent = "";
    formMessage.className = "contact-form-message";

    if (!name || !email || !phone || !message) {
        showMessage(
            "Please fill all required fields.",
            false
        );
        return;
    }

    try {
        submitButton.disabled = true;
        submitButton.textContent = "Sending...";

        const response = await fetch(CONTACT_API_URL, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name,
                email,
                phone,
                subject,
                message
            })
        });

        const data = await response.json();

        console.log("Contact API response:", data);

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to send message."
            );
        }

        showMessage(
            data.message ||
            "Your message has been submitted successfully.",
            true
        );

        document.getElementById("contactForm").reset();

    } catch (error) {
        console.error("Contact submit error:", error);

        showMessage(
            error.message ||
            "Unable to submit message. Check backend.",
            false
        );

    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Send Message";
    }
}

function showMessage(message, success) {
    const formMessage =
        document.getElementById("contactFormMessage");

    if (!formMessage) {
        alert(message);
        return;
    }

    formMessage.textContent = message;

    formMessage.className = success
        ? "contact-form-message contact-success-message"
        : "contact-form-message contact-error-message";
}

function updateCartCount() {
    const cartCount =
        document.getElementById("cartCount");

    if (!cartCount) {
        return;
    }

    try {
        const cart =
            JSON.parse(localStorage.getItem("cart")) || [];

        const totalQuantity = cart.reduce(
            (total, item) =>
                total + Number(item.quantity || 1),
            0
        );

        cartCount.textContent = totalQuantity;

    } catch (error) {
        cartCount.textContent = "0";
    }
}

function updateAuthNavigation() {
    const authNav =
        document.getElementById("authNav");

    if (!authNav) {
        return;
    }

    try {
        const user =
            JSON.parse(localStorage.getItem("user"));

        if (user) {
            authNav.innerHTML = `
                <a href="profile.html">Profile</a>
            `;
        }

    } catch (error) {
        console.error("User data error:", error);
    }
}