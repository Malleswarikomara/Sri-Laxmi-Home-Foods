const ADMIN_CONTACT_API_URL =
    "https://sri-laxmi-home-foods.onrender.com/api/contact";

let adminContacts = [];

/* =========================================
   HELPERS
========================================= */

function getAdminToken() {
    return localStorage.getItem("token");
}

function getAdminUser() {
    try {
        return JSON.parse(
            localStorage.getItem("user")
        );
    } catch (error) {
        return null;
    }
}

function escapeContactHTML(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatContactDate(dateValue) {
    if (!dateValue) {
        return "Date unavailable";
    }

    return new Date(dateValue).toLocaleString(
        "en-IN",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}

/* =========================================
   ADMIN PROTECTION
========================================= */

function protectAdminContactPage() {
    const token = getAdminToken();
    const user = getAdminUser();

    if (!token || !user) {
        alert("Please login as admin.");

        window.location.href = "login.html";
        return false;
    }

    if (user.role !== "admin") {
        alert("Admin access only.");

        window.location.href = "index.html";
        return false;
    }

    return true;
}

/* =========================================
   LOAD CONTACTS
========================================= */

async function loadAdminContacts() {
    const message =
        document.getElementById(
            "adminContactMessage"
        );

    try {
        message.style.display = "block";
        message.textContent =
            "Loading customer messages...";

        const response = await fetch(
            ADMIN_CONTACT_API_URL,
            {
                headers: {
                    Authorization:
                        `Bearer ${getAdminToken()}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Unable to load messages."
            );
        }

        adminContacts = Array.isArray(data.contacts)
            ? data.contacts
            : [];

        updateContactSummary();
        renderAdminContacts(adminContacts);

    } catch (error) {
        console.error(
            "Load admin contacts error:",
            error
        );

        message.style.display = "block";
        message.textContent = error.message;
    }
}

/* =========================================
   SUMMARY
========================================= */

function updateContactSummary() {
    const total =
        adminContacts.length;

    const newCount =
        adminContacts.filter(
            (contact) =>
                contact.status === "New"
        ).length;

    const repliedCount =
        adminContacts.filter(
            (contact) =>
                contact.status === "Replied"
        ).length;

    document.getElementById(
        "totalContactCount"
    ).textContent = total;

    document.getElementById(
        "newContactCount"
    ).textContent = newCount;

    document.getElementById(
        "repliedContactCount"
    ).textContent = repliedCount;
}

/* =========================================
   RENDER
========================================= */

function getContactStatusClass(status) {
    if (status === "Read") {
        return "contact-status-read";
    }

    if (status === "Replied") {
        return "contact-status-replied";
    }

    return "contact-status-new";
}

function createAdminContactCard(contact) {
    const status =
        contact.status || "New";

    return `
        <article class="admin-contact-card">

            <div class="admin-contact-card-header">

                <div>

                    <span class="admin-contact-category">
                        ${escapeContactHTML(
                            contact.subject ||
                            "General Enquiry"
                        )}
                    </span>

                    <h2>
                        ${escapeContactHTML(
                            contact.name
                        )}
                    </h2>

                    <p>
                        ${formatContactDate(
                            contact.createdAt
                        )}
                    </p>

                </div>

                <span
                    class="
                        admin-contact-status
                        ${getContactStatusClass(status)}
                    "
                >
                    ${escapeContactHTML(status)}
                </span>

            </div>

            <div class="admin-contact-card-body">

                <div class="admin-contact-details">

                    <div class="admin-contact-detail">

                        <span>Email</span>

                        <a
                            href="mailto:${escapeContactHTML(
                                contact.email
                            )}"
                        >
                            ${escapeContactHTML(
                                contact.email
                            )}
                        </a>

                    </div>

                    <div class="admin-contact-detail">

                        <span>Phone</span>

                        <a
                            href="tel:${escapeContactHTML(
                                contact.phone
                            )}"
                        >
                            ${escapeContactHTML(
                                contact.phone
                            )}
                        </a>

                    </div>

                    <div class="admin-contact-detail">

                        <span>Subject</span>

                        <strong>
                            ${escapeContactHTML(
                                contact.subject ||
                                "General Enquiry"
                            )}
                        </strong>

                    </div>

                </div>

                <div class="admin-contact-customer-message">

                    <h3>Customer Message</h3>

                    <p>
                        ${escapeContactHTML(
                            contact.message
                        )}
                    </p>

                </div>

            </div>

            <div class="admin-contact-actions">

                <select
                    class="contact-status-select"
                    data-contact-id="${escapeContactHTML(
                        contact._id
                    )}"
                >

                    <option
                        value="New"
                        ${status === "New"
                            ? "selected"
                            : ""}
                    >
                        New
                    </option>

                    <option
                        value="Read"
                        ${status === "Read"
                            ? "selected"
                            : ""}
                    >
                        Read
                    </option>

                    <option
                        value="Replied"
                        ${status === "Replied"
                            ? "selected"
                            : ""}
                    >
                        Replied
                    </option>

                </select>

                <button
                    type="button"
                    class="update-contact-status-button"
                    data-contact-id="${escapeContactHTML(
                        contact._id
                    )}"
                >
                    Update Status
                </button>

            </div>

        </article>
    `;
}

function renderAdminContacts(contacts) {
    const container =
        document.getElementById(
            "adminContactsContainer"
        );

    const message =
        document.getElementById(
            "adminContactMessage"
        );

    message.style.display = "none";

    if (!contacts.length) {
        container.innerHTML = `
            <div class="admin-contact-empty">

                <h2>No Messages Found</h2>

                <p>
                    Customer contact messages will
                    appear here.
                </p>

            </div>
        `;

        return;
    }

    container.innerHTML =
        contacts
            .map(createAdminContactCard)
            .join("");
}

/* =========================================
   FILTER
========================================= */

function filterAdminContacts() {
    const selectedStatus =
        document.getElementById(
            "contactStatusFilter"
        ).value;

    if (selectedStatus === "All") {
        renderAdminContacts(adminContacts);
        return;
    }

    const filteredContacts =
        adminContacts.filter(
            (contact) =>
                contact.status === selectedStatus
        );

    renderAdminContacts(filteredContacts);
}

/* =========================================
   UPDATE STATUS
========================================= */

async function updateAdminContactStatus(
    contactId,
    button
) {
    const select =
        document.querySelector(
            `.contact-status-select[data-contact-id="${contactId}"]`
        );

    if (!select) {
        return;
    }

    try {
        button.disabled = true;
        button.textContent = "Updating...";

        const response = await fetch(
            `${ADMIN_CONTACT_API_URL}/${contactId}/status`,
            {
                method: "PATCH",

                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${getAdminToken()}`
                },

                body: JSON.stringify({
                    status: select.value
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Unable to update status."
            );
        }

        alert(
            data.message ||
            "Status updated successfully."
        );

        await loadAdminContacts();

    } catch (error) {
        console.error(
            "Update contact status error:",
            error
        );

        alert(error.message);

    } finally {
        button.disabled = false;
        button.textContent =
            "Update Status";
    }
}

/* =========================================
   EVENTS
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {
        if (!protectAdminContactPage()) {
            return;
        }

        const menuToggle =
            document.getElementById("menuToggle");

        const navLinks =
            document.getElementById("navLinks");

        menuToggle?.addEventListener(
            "click",
            function () {
                navLinks?.classList.toggle("show");
            }
        );

        document
            .getElementById(
                "contactStatusFilter"
            )
            ?.addEventListener(
                "change",
                filterAdminContacts
            );

        document
            .getElementById(
                "adminContactsContainer"
            )
            ?.addEventListener(
                "click",
                function (event) {
                    const button =
                        event.target.closest(
                            ".update-contact-status-button"
                        );

                    if (!button) {
                        return;
                    }

                    updateAdminContactStatus(
                        button.dataset.contactId,
                        button
                    );
                }
            );

        document
            .getElementById(
                "adminLogoutButton"
            )
            ?.addEventListener(
                "click",
                function () {
                    localStorage.removeItem(
                        "token"
                    );

                    localStorage.removeItem(
                        "user"
                    );

                    window.location.href =
                        "login.html";
                }
            );

        loadAdminContacts();
    }
);