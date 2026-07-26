const express = require("express");

const router = express.Router();

const protect =
    require("../middleware/authMiddleware");

const adminOnly =
    require("../middleware/adminMiddleware");

const {
    createContactMessage,
    getContactMessages,
    updateContactStatus
} = require("../controllers/contactController");

/* =========================================
   PUBLIC ROUTE
========================================= */

// Customer/contact visitor message submit
router.post(
    "/",
    createContactMessage
);

/* =========================================
   ADMIN ROUTES
========================================= */

// View all customer messages
router.get(
    "/",
    protect,
    adminOnly,
    getContactMessages
);

// Update message status
router.patch(
    "/:id/status",
    protect,
    adminOnly,
    updateContactStatus
);

module.exports = router;