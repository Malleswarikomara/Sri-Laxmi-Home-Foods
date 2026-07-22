const express = require("express");

const router = express.Router();

const {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword
} = require("../controllers/authController");

/* =========================================
   AUTH ROUTES
========================================= */

// Register new user
router.post(
    "/register",
    registerUser
);

// Login user
router.post(
    "/login",
    loginUser
);

// Send password reset email
router.post(
    "/forgot-password",
    forgotPassword
);

// Reset password using token
router.patch(
    "/reset-password/:token",
    resetPassword
);

module.exports = router;