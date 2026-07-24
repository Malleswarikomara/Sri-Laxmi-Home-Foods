const ORDER_API =
    "https://sri-laxmi-home-foods.onrender.com/api/orders";

const checkoutForm =
    document.getElementById("checkoutForm");

/* =========================================
   CHECKOUT PAGE LOGIN PROTECTION
========================================= */

function protectCheckoutPage() {
    const token =
        localStorage.getItem("token");

    const storedUser =
        localStorage.getItem("user");

    if (!token || !storedUser) {
        alert(
            "Please login before proceeding to checkout."
        );

        window.location.replace(
            "login.html"
        );

        return false;
    }

    try {
        const user =
            JSON.parse(storedUser);

        if (!user || !user.email) {
            throw new Error(
                "Invalid user information."
            );
        }
    } catch (error) {
        console.error(
            "Checkout login data error:",
            error
        );

        clearCheckoutLoginData();

        alert(
            "Invalid login information. Please login again."
        );

        window.location.replace(
            "login.html"
        );

        return false;
    }

    return true;
}

function clearCheckoutLoginData() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("lastOrder");
}

/* =========================================
   CART
========================================= */

function getCheckoutCart() {
    try {
        const cart =
            JSON.parse(
                localStorage.getItem("cart")
            ) || [];

        return Array.isArray(cart)
            ? cart
            : [];
    } catch (error) {
        console.error(
            "Checkout cart error:",
            error
        );

        return [];
    }
}

function calculateTotal(cart) {
    return cart.reduce(
        function (total, item) {
            const price =
                Number(item.price || 0);

            const quantity =
                Number(item.quantity || 1);

            return total + price * quantity;
        },
        0
    );
}

/* =========================================
   CUSTOMER DETAILS
========================================= */

function fillLoggedInUserDetails() {
    try {
        const storedUser =
            localStorage.getItem("user");

        if (!storedUser) {
            return;
        }

        const user =
            JSON.parse(storedUser);

        const nameInput =
            document.getElementById("name");

        const emailInput =
            document.getElementById("email");

        if (
            nameInput &&
            user.name &&
            !nameInput.value.trim()
        ) {
            nameInput.value =
                user.name.trim();
        }

        if (
            emailInput &&
            user.email &&
            !emailInput.value.trim()
        ) {
            emailInput.value =
                user.email.trim();
        }
    } catch (error) {
        console.error(
            "Unable to load user details:",
            error
        );
    }
}

/* =========================================
   HELPERS
========================================= */

function getInputValue(id) {
    return (
        document
            .getElementById(id)
            ?.value.trim() || ""
    );
}

function normalizePhone(phoneValue) {
    let phone =
        String(phoneValue || "")
            .replace(/\D/g, "");

    if (
        phone.length === 12 &&
        phone.startsWith("91")
    ) {
        phone = phone.slice(2);
    }

    return phone;
}

function showCheckoutMessage(
    message,
    success = false
) {
    const messageElement =
        document.getElementById(
            "checkoutMessage"
        );

    if (!messageElement) {
        alert(message);
        return;
    }

    messageElement.textContent =
        message;

    messageElement.className =
        success
            ? "checkout-message checkout-success"
            : "checkout-message checkout-error";

    messageElement.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function clearCheckoutMessage() {
    const messageElement =
        document.getElementById(
            "checkoutMessage"
        );

    if (!messageElement) {
        return;
    }

    messageElement.textContent = "";
    messageElement.className =
        "checkout-message";
}

/* =========================================
   VALIDATION
========================================= */

function validateCheckoutDetails(details) {
    if (
        !details.customerName ||
        details.customerName.length < 2
    ) {
        return "Please enter your full name.";
    }

    if (
        !/^[6-9]\d{9}$/.test(
            details.phone
        )
    ) {
        return "Enter a valid Indian 10-digit mobile number.";
    }

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
        !emailPattern.test(
            details.email
        )
    ) {
        return "Please enter a valid email address.";
    }

    if (!details.address.house) {
        return "House or flat number is required.";
    }

    if (!details.address.street) {
        return "Street or road name is required.";
    }

    if (!details.address.area) {
        return "Area or locality is required.";
    }

    if (!details.address.city) {
        return "City is required.";
    }

    if (
        details.address.city
            .toLowerCase() !==
        "hyderabad"
    ) {
        return "We currently deliver only within Hyderabad.";
    }

    if (
        !/^\d{6}$/.test(
            details.address.pincode
        )
    ) {
        return "Enter a valid 6-digit pincode.";
    }

    if (
        !details.address.pincode
            .startsWith("500")
    ) {
        return "Delivery is currently available only for Hyderabad 500xxx pincodes.";
    }

    if (!details.paymentMethod) {
        return "Please select a payment method.";
    }

    return null;
}

/* =========================================
   CREATE ORDER DATA
========================================= */

function createOrderData(cart) {
    const phone =
        normalizePhone(
            getInputValue("phone")
        );

    const paymentMethod =
        document.querySelector(
            'input[name="payment"]:checked'
        )?.value || "";

    const items =
        cart.map(
            function (item) {
                return {
                    foodId:
                        item._id ||
                        item.foodId,

                    name:
                        item.name ||
                        "Food Item",

                    price:
                        Number(
                            item.price || 0
                        ),

                    quantity:
                        Number(
                            item.quantity || 1
                        )
                };
            }
        );

    return {
        customerName:
            getInputValue("name"),

        phone,

        email:
            getInputValue("email")
                .toLowerCase(),

        address: {
            house:
                getInputValue("house"),

            street:
                getInputValue("street"),

            area:
                getInputValue("area"),

            landmark:
                getInputValue("landmark"),

            city:
                getInputValue("city"),

            pincode:
                getInputValue("pincode")
        },

        location: {
            latitude:
                window.customerLocation
                    ?.latitude ?? null,

            longitude:
                window.customerLocation
                    ?.longitude ?? null
        },

        items,

        totalAmount:
            calculateTotal(cart),

        paymentMethod
    };
}

/* =========================================
   SUBMIT ORDER
========================================= */

async function submitCheckoutForm(event) {
    event.preventDefault();

    clearCheckoutMessage();

    const token =
        localStorage.getItem("token");

    if (!token) {
        alert(
            "Please login before placing an order."
        );

        window.location.replace(
            "login.html"
        );

        return;
    }

    const cart =
        getCheckoutCart();

    if (cart.length === 0) {
        alert("Your cart is empty.");

        window.location.replace(
            "cart.html"
        );

        return;
    }

    const orderData =
        createOrderData(cart);

    const missingFood =
        orderData.items.some(
            function (item) {
                return !item.foodId;
            }
        );

    if (missingFood) {
        showCheckoutMessage(
            "One or more cart items are invalid. Please remove them and add the foods again."
        );

        return;
    }

    const invalidQuantity =
        orderData.items.some(
            function (item) {
                return (
                    item.quantity < 1 ||
                    item.price < 0
                );
            }
        );

    if (invalidQuantity) {
        showCheckoutMessage(
            "One or more cart items have an invalid quantity or price."
        );

        return;
    }

    const validationError =
        validateCheckoutDetails(
            orderData
        );

    if (validationError) {
        showCheckoutMessage(
            validationError
        );

        return;
    }

    if (
        orderData.paymentMethod ===
        "ONLINE"
    ) {
        showCheckoutMessage(
            "Online payment will be added later. Please select Cash on Delivery."
        );

        return;
    }

    const submitButton =
        document.getElementById(
            "placeOrderButton"
        ) ||
        checkoutForm?.querySelector(
            'button[type="submit"]'
        );

    try {
        if (submitButton) {
            submitButton.disabled =
                true;

            submitButton.textContent =
                "Placing Order...";
        }

        const response =
            await fetch(
                ORDER_API,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify(
                            orderData
                        )
                }
            );

        let data;

        try {
            data =
                await response.json();
        } catch (error) {
            throw new Error(
                "Invalid response from server."
            );
        }

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            clearCheckoutLoginData();

            alert(
                response.status === 403
                    ? "You are not allowed to place this order."
                    : "Your login session has expired. Please login again."
            );

            window.location.replace(
                "login.html"
            );

            return;
        }

        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                "Order could not be placed."
            );
        }

        localStorage.removeItem(
            "cart"
        );

        localStorage.setItem(
            "lastOrder",
            JSON.stringify(
                data.order
            )
        );

        showCheckoutMessage(
            "Order placed successfully!",
            true
        );

        setTimeout(
            function () {
                window.location.replace(
                    "order-success.html"
                );
            },
            700
        );

    } catch (error) {
        console.error(
            "Place order error:",
            error
        );

        showCheckoutMessage(
            error.message ||
            "Unable to place order."
        );

    } finally {
        if (submitButton) {
            submitButton.disabled =
                false;

            submitButton.textContent =
                "Place Order";
        }
    }
}

/* =========================================
   NAVBAR
========================================= */

function setupCheckoutNavbar() {
    const menuToggle =
        document.getElementById(
            "menuToggle"
        );

    const navLinks =
        document.getElementById(
            "navLinks"
        );

    if (!menuToggle || !navLinks) {
        return;
    }

    menuToggle.addEventListener(
        "click",
        function () {
            navLinks.classList.toggle(
                "show"
            );

            const isOpen =
                navLinks.classList.contains(
                    "show"
                );

            menuToggle.textContent =
                isOpen ? "✕" : "☰";
        }
    );

    navLinks
        .querySelectorAll("a")
        .forEach(
            function (link) {
                link.addEventListener(
                    "click",
                    function () {
                        navLinks.classList.remove(
                            "show"
                        );

                        menuToggle.textContent =
                            "☰";
                    }
                );
            }
        );
}

/* =========================================
   PAGE EVENTS
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {
        const hasCheckoutAccess =
            protectCheckoutPage();

        if (!hasCheckoutAccess) {
            return;
        }

        fillLoggedInUserDetails();

        setupCheckoutNavbar();

        checkoutForm?.addEventListener(
            "submit",
            submitCheckoutForm
        );
    }
);