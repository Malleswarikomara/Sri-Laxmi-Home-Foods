const MY_ORDERS_API =
    "http://localhost:5000/api/orders/my-orders";

const CANCEL_ORDER_API =
    "http://localhost:5000/api/orders";

const ordersContainer =
    document.getElementById("ordersContainer");

/* =========================================
   FORMAT ORDER DATE
========================================= */

function formatOrderDate(dateValue) {
    const date = new Date(dateValue);

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

/* =========================================
   ORDER STATUS CLASS
========================================= */

function getStatusClass(status) {
    const normalizedStatus =
        String(status || "").toLowerCase();

    if (normalizedStatus === "delivered") {
        return "status-delivered";
    }

    if (
        normalizedStatus === "cancelled" ||
        normalizedStatus === "rejected"
    ) {
        return "status-cancelled";
    }

    if (
        normalizedStatus === "confirmed" ||
        normalizedStatus === "preparing" ||
        normalizedStatus === "out for delivery"
    ) {
        return "status-processing";
    }

    return "status-pending";
}

/* =========================================
   CREATE ORDER ITEMS
========================================= */

function createOrderItems(items = []) {
    return items
        .map((item) => {
            const price =
                Number(item.price || 0);

            const quantity =
                Number(item.quantity || 1);

            return `
                <div class="order-food-item">

                    <div>
                        <strong>
                            ${item.name || "Food Item"}
                        </strong>

                        <span>
                            ₹${price} × ${quantity}
                        </span>
                    </div>

                    <strong>
                        ₹${price * quantity}
                    </strong>

                </div>
            `;
        })
        .join("");
}

/* =========================================
   CREATE CANCEL BUTTON
========================================= */

function createCancelButton(order) {
    if (order.orderStatus !== "Pending") {
        return "";
    }

    return `
        <button
            type="button"
            class="cancel-order-button"
            data-order-id="${order._id}"
        >
            Cancel Order
        </button>
    `;
}

/* =========================================
   CREATE ORDER CARD
========================================= */

function createOrderCard(order) {
    const shortOrderId =
        order._id.slice(-8).toUpperCase();

    const address =
        order.address || {};

    return `
        <article class="order-history-card">

            <div class="order-card-header">

                <div>
                    <span class="order-number-label">
                        ORDER ID
                    </span>

                    <h2>#${shortOrderId}</h2>

                    <p>
                        ${formatOrderDate(order.createdAt)}
                    </p>
                </div>

                <span
                    class="order-status ${getStatusClass(
                        order.orderStatus
                    )}"
                >
                    ${order.orderStatus || "Pending"}
                </span>

            </div>

            <div class="order-items-list">
                ${createOrderItems(order.items)}
            </div>

            <div class="order-delivery-details">

                <div>
                    <span>Delivery Address</span>

                    <p>
                        ${address.house || ""},
                        ${address.street || ""},
                        ${address.area || ""},
                        ${address.city || ""} -
                        ${address.pincode || ""}
                    </p>
                </div>

                <div>
                    <span>Payment</span>

                    <p>
                        ${order.paymentMethod || "COD"}
                    </p>
                </div>

            </div>

            <div class="order-card-footer">

                <div>
                    <span>Total Amount</span>

                    <strong>
                        ₹${Number(order.totalAmount || 0)}
                    </strong>
                </div>

                <div class="order-action-buttons">

                    ${createCancelButton(order)}

                    <a
                        href="menu.html"
                        class="order-again-button"
                    >
                        Order Again
                    </a>

                </div>

            </div>

        </article>
    `;
}

/* =========================================
   RENDER ORDERS
========================================= */

function renderOrders(orders) {
    if (!ordersContainer) {
        return;
    }

    if (!Array.isArray(orders) || orders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="orders-empty-state">

                <div class="empty-orders-icon">
                    📦
                </div>

                <h2>No Orders Yet</h2>

                <p>
                    You have not placed an order yet.
                    Explore our menu and order your favourite foods.
                </p>

                <a href="menu.html">
                    Explore Menu
                </a>

            </div>
        `;

        return;
    }

    ordersContainer.innerHTML =
        orders.map(createOrderCard).join("");
}

/* =========================================
   LOAD CUSTOMER ORDERS
========================================= */

async function loadMyOrders() {
    const token =
        localStorage.getItem("token");

    if (!token) {
        alert("Please login to view your orders.");

        window.location.href = "login.html";
        return;
    }

    if (ordersContainer) {
        ordersContainer.innerHTML = `
            <div class="orders-message">
                Loading your orders...
            </div>
        `;
    }

    try {
        const response = await fetch(
            MY_ORDERS_API,
            {
                method: "GET",

                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            alert(
                "Your login session has expired."
            );

            window.location.href =
                "login.html";

            return;
        }

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Unable to load orders."
            );
        }

        renderOrders(data.orders);

    } catch (error) {
        console.error(
            "Load orders error:",
            error
        );

        if (ordersContainer) {
            ordersContainer.innerHTML = `
                <div class="orders-message orders-error">
                    ${error.message}
                </div>
            `;
        }
    }
}

/* =========================================
   CANCEL CUSTOMER ORDER
========================================= */

async function cancelOrder(
    orderId,
    cancelButton
) {
    const confirmed = confirm(
        "Are you sure you want to cancel this order?"
    );

    if (!confirmed) {
        return;
    }

    const token =
        localStorage.getItem("token");

    if (!token) {
        alert("Please login again.");

        window.location.href =
            "login.html";

        return;
    }

    try {
        cancelButton.disabled = true;
        cancelButton.textContent =
            "Cancelling...";

        const response = await fetch(
            `${CANCEL_ORDER_API}/${orderId}/cancel`,
            {
                method: "PATCH",

                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            alert(
                "Your login session has expired."
            );

            window.location.href =
                "login.html";

            return;
        }

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Unable to cancel order."
            );
        }

        alert(
            data.message ||
            "Order cancelled successfully."
        );

        await loadMyOrders();

    } catch (error) {
        console.error(
            "Cancel order error:",
            error
        );

        alert(error.message);

        cancelButton.disabled = false;
        cancelButton.textContent =
            "Cancel Order";
    }
}

/* =========================================
   CANCEL BUTTON CLICK EVENT
========================================= */

function handleOrderActions(event) {
    const cancelButton =
        event.target.closest(
            ".cancel-order-button"
        );

    if (!cancelButton) {
        return;
    }

    const orderId =
        cancelButton.dataset.orderId;

    if (!orderId) {
        alert("Order ID not found.");
        return;
    }

    cancelOrder(
        orderId,
        cancelButton
    );
}

/* =========================================
   PAGE LOAD
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {
        loadMyOrders();

        ordersContainer?.addEventListener(
            "click",
            handleOrderActions
        );
    }
);