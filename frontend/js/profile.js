document.addEventListener(
    "DOMContentLoaded",
    function () {
        const token =
            localStorage.getItem("token");

        const storedUser =
            localStorage.getItem("user");

        if (!token || !storedUser) {
            alert(
                "Please login to view your profile."
            );

            window.location.href =
                "login.html";

            return;
        }

        let user;

        try {
            user = JSON.parse(storedUser);
        } catch (error) {
            clearLoginData();

            alert(
                "Login information is invalid. Please login again."
            );

            window.location.href =
                "login.html";

            return;
        }

        displayProfile(user);
        configureRoleActions(user);
        updateProfileCartCount();
        setupProfileEvents();
    }
);

/* =========================================
   DISPLAY PROFILE
========================================= */

function displayProfile(user) {
    const name =
        user.name?.trim() || "User";

    const email =
        user.email?.trim() || "Not available";

    const role =
        String(user.role || "customer")
            .toLowerCase();

    const formattedRole =
        role === "admin"
            ? "Admin"
            : "Customer";

    setTextContent(
        "profileName",
        name
    );

    setTextContent(
        "profileEmail",
        email
    );

    setTextContent(
        "profileRole",
        formattedRole
    );

    setTextContent(
        "profileNameDetail",
        name
    );

    setTextContent(
        "profileEmailDetail",
        email
    );

    setTextContent(
        "profileRoleDetail",
        formattedRole
    );

    const profileInitial =
        document.getElementById(
            "profileInitial"
        );

    if (profileInitial) {
        profileInitial.textContent =
            name.charAt(0).toUpperCase();
    }

    const profileRole =
        document.getElementById(
            "profileRole"
        );

    if (profileRole) {
        profileRole.classList.toggle(
            "admin-role",
            role === "admin"
        );
    }
}

/* =========================================
   ROLE-BASED ACTIONS
========================================= */

function configureRoleActions(user) {
    const role =
        String(user.role || "customer")
            .toLowerCase();

    const customerActions =
        document.getElementById(
            "customerActions"
        );

    const adminActions =
        document.getElementById(
            "adminActions"
        );

    if (role === "admin") {
        if (customerActions) {
            customerActions.style.display =
                "none";
        }

        if (adminActions) {
            adminActions.style.display =
                "block";
        }
    } else {
        if (customerActions) {
            customerActions.style.display =
                "flex";
        }

        if (adminActions) {
            adminActions.style.display =
                "none";
        }
    }
}

/* =========================================
   EVENTS
========================================= */

function setupProfileEvents() {
    const logoutButton =
        document.getElementById(
            "logoutButton"
        );

    const menuToggle =
        document.getElementById(
            "menuToggle"
        );

    const navLinks =
        document.getElementById(
            "navLinks"
        );

    logoutButton?.addEventListener(
        "click",
        logoutUser
    );

    menuToggle?.addEventListener(
        "click",
        function () {
            navLinks?.classList.toggle(
                "show"
            );
        }
    );
}

/* =========================================
   LOGOUT
========================================= */

function logoutUser() {
    const confirmed = confirm(
        "Are you sure you want to logout?"
    );

    if (!confirmed) {
        return;
    }

    clearLoginData();

    alert("Logged out successfully.");

    window.location.href =
        "login.html";
}

function clearLoginData() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("lastOrder");
}

/* =========================================
   CART COUNT
========================================= */

function updateProfileCartCount() {
    const cartCount =
        document.getElementById(
            "cartCount"
        );

    if (!cartCount) {
        return;
    }

    try {
        const cart =
            JSON.parse(
                localStorage.getItem("cart")
            ) || [];

        const totalQuantity =
            cart.reduce(
                function (total, item) {
                    return (
                        total +
                        Number(item.quantity || 1)
                    );
                },
                0
            );

        cartCount.textContent =
            totalQuantity;
    } catch (error) {
        cartCount.textContent = "0";
    }
}

/* =========================================
   HELPER
========================================= */

function setTextContent(elementId, value) {
    const element =
        document.getElementById(
            elementId
        );

    if (element) {
        element.textContent = value;
    }
}