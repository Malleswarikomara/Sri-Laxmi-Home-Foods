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

/* Public route */

router.post(
    "/",
    createContactMessage
);

/* Admin routes */

router.get(
    "/",
    protect,
    adminOnly,
    getContactMessages
);

router.patch(
    "/:id/status",
    protect,
    adminOnly,
    updateContactStatus
);
router.post("/", createContactMessage);

router.get(
    "/",
    protect,
    adminOnly,
    getContactMessages
);

router.patch(
    "/:id/status",
    protect,
    adminOnly,
    updateContactStatus
);

module.exports = router;