const ADMIN_ORDERS_API =
    "https://sri-laxmi-home-foods.onrender.com/api/orders/admin/all";

const UPDATE_STATUS_API =
    "https://sri-laxmi-home-foods.onrender.com/api/orders/admin";

const adminOrdersContainer =
    document.getElementById("adminOrdersContainer");

const adminMessage =
    document.getElementById("adminMessage");

const totalOrdersElement =
    document.getElementById("totalOrders");

const pendingOrdersElement =
    document.getElementById("pendingOrders");

const deliveredOrdersElement =
    document.getElementById("deliveredOrders");

const orderStatuses = [
    "Pending",
    "Confirmed",
    "Preparing",
    "Out for Delivery",
    "Delivered",
    "Cancelled"
];

/* =========================================
   ADMIN PAGE PROTECTION
========================================= */

function protectAdminOrdersPage() {
    const token =
        localStorage.getItem("token");

    const storedUser =
        localStorage.getItem("user");

    if (!token || !storedUser) {
        alert("Please login as admin.");

        window.location.replace("login.html");

        return false;
    }

    let user;

    try {
        user = JSON.parse(storedUser);
    } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        alert(
            "Invalid login information. Please login again."
        );

        window.location.replace("login.html");

        return false;
    }

    const role =
        String(user.role || "")
            .trim()
            .toLowerCase();

    if (role !== "admin") {
        alert("Admin access only.");

        window.location.replace("index.html");

        return false;
    }

    return true;
}

/* =========================================
   HELPERS
========================================= */

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatAdminDate(dateValue) {
    if (!dateValue) {
        return "Date unavailable";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function createStatusOptions(currentStatus) {
    return orderStatuses
        .map(function (status) {
            const selected =
                status === currentStatus
                    ? "selected"
                    : "";

            return `
                <option
                    value="${escapeHTML(status)}"
                    ${selected}
                >
                    ${escapeHTML(status)}
                </option>
            `;
        })
        .join("");
}

/* =========================================
   ORDER ITEMS
========================================= */

function createItemsList(items = []) {
    if (!Array.isArray(items) || items.length === 0) {
        return `
            <li>
                <span>No items found</span>
            </li>
        `;
    }

    return items
        .map(function (item) {
            const price =
                Number(item.price || 0);

            const quantity =
                Number(item.quantity || 1);

            return `
                <li>
                    <span>
                        ${escapeHTML(
                            item.name || "Food Item"
                        )}
                        × ${quantity}
                    </span>

                    <strong>
                        ₹${price * quantity}
                    </strong>
                </li>
            `;
        })
        .join("");
}

/* =========================================
   CREATE ORDER CARD
========================================= */

function createAdminOrderCard(order) {
    const orderId =
        escapeHTML(order._id || "");

    const shortOrderId =
        orderId
            ? orderId.slice(-8).toUpperCase()
            : "UNKNOWN";

    const customerName =
        order.user?.name ||
        order.customerName ||
        "Unknown Customer";

    const customerEmail =
        order.user?.email ||
        order.email ||
        "Not available";

    const customerPhone =
        order.user?.phone ||
        order.phone ||
        "Not available";

    const address =
        order.address || {};

    const orderStatus =
        order.orderStatus || "Pending";

    return `
        <article class="admin-order-card">

            <div class="admin-order-header">

                <div>
                    <span>ORDER ID</span>

                    <h2>
                        #${shortOrderId}
                    </h2>

                    <p>
                        ${formatAdminDate(
                            order.createdAt
                        )}
                    </p>
                </div>

                <div class="admin-order-total">
                    <span>Total</span>

                    <strong>
                        ₹${Number(
                            order.totalAmount || 0
                        )}
                    </strong>
                </div>

            </div>

            <div class="admin-order-grid">

                <section>
                    <h3>Customer Details</h3>

                    <p>
                        <strong>Name:</strong>
                        ${escapeHTML(customerName)}
                    </p>

                    <p>
                        <strong>Email:</strong>
                        ${escapeHTML(customerEmail)}
                    </p>

                    <p>
                        <strong>Phone:</strong>
                        ${escapeHTML(customerPhone)}
                    </p>
                </section>

                <section>
                    <h3>Delivery Address</h3>

                    <p>
                        ${escapeHTML(
                            address.house || ""
                        )},
                        ${escapeHTML(
                            address.street || ""
                        )},
                        ${escapeHTML(
                            address.area || ""
                        )}
                    </p>

                    <p>
                        ${escapeHTML(
                            address.landmark ||
                            "No landmark"
                        )}
                    </p>

                    <p>
                        ${escapeHTML(
                            address.city || ""
                        )}
                        -
                        ${escapeHTML(
                            address.pincode || ""
                        )}
                    </p>
                </section>

                <section>
                    <h3>Payment</h3>

                    <p>
                        <strong>Method:</strong>
                        ${escapeHTML(
                            order.paymentMethod ||
                            "COD"
                        )}
                    </p>

                    <p>
                        <strong>Current Status:</strong>
                        ${escapeHTML(orderStatus)}
                    </p>
                </section>

            </div>

            <div class="admin-order-items">

                <h3>Ordered Items</h3>

                <ul>
                    ${createItemsList(order.items)}
                </ul>

            </div>

            <div class="admin-status-update">

                <select
                    id="status-${orderId}"
                    aria-label="Order status"
                >
                    ${createStatusOptions(
                        orderStatus
                    )}
                </select>

                <button
                    type="button"
                    onclick="updateOrderStatus(
                        '${orderId}',
                        this
                    )"
                >
                    Update Status
                </button>

            </div>

        </article>
    `;
}

/* =========================================
   SUMMARY
========================================= */

function updateSummary(orders) {
    const orderList =
        Array.isArray(orders)
            ? orders
            : [];

    if (totalOrdersElement) {
        totalOrdersElement.textContent =
            orderList.length;
    }

    if (pendingOrdersElement) {
        pendingOrdersElement.textContent =
            orderList.filter(
                function (order) {
                    return (
                        order.orderStatus ===
                        "Pending"
                    );
                }
            ).length;
    }

    if (deliveredOrdersElement) {
        deliveredOrdersElement.textContent =
            orderList.filter(
                function (order) {
                    return (
                        order.orderStatus ===
                        "Delivered"
                    );
                }
            ).length;
    }
}

/* =========================================
   RENDER ORDERS
========================================= */

function renderAdminOrders(orders) {
    const orderList =
        Array.isArray(orders)
            ? orders
            : [];

    updateSummary(orderList);

    if (!adminOrdersContainer) {
        return;
    }

    if (orderList.length === 0) {
        if (adminMessage) {
            adminMessage.style.display =
                "block";

            adminMessage.textContent =
                "No orders found.";
        }

        adminOrdersContainer.innerHTML =
            "";

        return;
    }

    if (adminMessage) {
        adminMessage.style.display =
            "none";
    }

    adminOrdersContainer.innerHTML =
        orderList
            .map(createAdminOrderCard)
            .join("");
}

/* =========================================
   LOAD ADMIN ORDERS
========================================= */

async function loadAdminOrders() {
    const token =
        localStorage.getItem("token");

    if (!token) {
        alert("Please login as admin.");

        window.location.replace(
            "login.html"
        );

        return;
    }

    if (adminMessage) {
        adminMessage.style.display =
            "block";

        adminMessage.textContent =
            "Loading orders...";
    }

    try {
        const response = await fetch(
            ADMIN_ORDERS_API,
            {
                method: "GET",

                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const data =
            await response.json();

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            alert(
                response.status === 403
                    ? "Admin access only."
                    : "Login session expired."
            );

            window.location.replace(
                response.status === 403
                    ? "index.html"
                    : "login.html"
            );

            return;
        }

        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                "Unable to load orders."
            );
        }

        renderAdminOrders(
            data.orders || []
        );

    } catch (error) {
        console.error(
            "Load admin orders error:",
            error
        );

        if (adminMessage) {
            adminMessage.style.display =
                "block";

            adminMessage.textContent =
                error.message ||
                "Unable to load orders.";
        }
    }
}

/* =========================================
   UPDATE ORDER STATUS
========================================= */

async function updateOrderStatus(
    orderId,
    button
) {
    const token =
        localStorage.getItem("token");

    if (!token) {
        alert("Please login again.");

        window.location.replace(
            "login.html"
        );

        return;
    }

    const statusSelect =
        document.getElementById(
            `status-${orderId}`
        );

    if (!statusSelect) {
        alert("Order status field not found.");
        return;
    }

    const orderStatus =
        statusSelect.value;

    try {
        button.disabled = true;
        button.textContent =
            "Updating...";

        const response = await fetch(
            `${UPDATE_STATUS_API}/${orderId}/status`,
            {
                method: "PATCH",

                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${token}`
                },

                body: JSON.stringify({
                    orderStatus
                })
            }
        );

        const data =
            await response.json();

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            alert(
                response.status === 403
                    ? "Admin access only."
                    : "Login session expired."
            );

            window.location.replace(
                response.status === 403
                    ? "index.html"
                    : "login.html"
            );

            return;
        }

        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                "Unable to update order status."
            );
        }

        alert(
            data.message ||
            "Order status updated successfully."
        );

        await loadAdminOrders();

    } catch (error) {
        console.error(
            "Update order status error:",
            error
        );

        alert(
            error.message ||
            "Unable to update order status."
        );

    } finally {
        button.disabled = false;
        button.textContent =
            "Update Status";
    }
}

/* =========================================
   PAGE LOAD
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {
        const hasAdminAccess =
            protectAdminOrdersPage();

        if (!hasAdminAccess) {
            return;
        }

        loadAdminOrders();
    }
);