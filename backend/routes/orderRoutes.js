const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const {
    placeOrder,
    getMyOrders,
    getAllOrders,
    updateOrderStatus,
    cancelMyOrder
} = require("../controllers/orderController");

/* =========================================
   CUSTOMER ROUTES
========================================= */

// Place new order
router.post(
    "/",
    protect,
    placeOrder
);

// Get logged-in customer's orders
router.get(
    "/my-orders",
    protect,
    getMyOrders
);

// Cancel logged-in customer's pending order
router.patch(
    "/:id/cancel",
    protect,
    cancelMyOrder
);

/* =========================================
   ADMIN ROUTES
========================================= */

// Get all customer orders
router.get(
    "/admin/all",
    protect,
    adminOnly,
    getAllOrders
);

// Update order status
router.patch(
    "/admin/:id/status",
    protect,
    adminOnly,
    updateOrderStatus
);

module.exports = router;