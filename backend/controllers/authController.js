const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");

const User = require("../models/User");

/* =========================================
   HELPERS
========================================= */

function normalizeEmail(email = "") {
    return String(email)
        .trim()
        .toLowerCase();
}

function generateLoginToken(user) {
    return jwt.sign(
        {
            id: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
}

function createEmailTransporter() {
    const emailPort =
        Number(process.env.EMAIL_PORT || 587);

    const secureConnection =
        process.env.EMAIL_SECURE
            ? process.env.EMAIL_SECURE === "true"
            : emailPort === 465;

    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: emailPort,
        secure: secureConnection,

        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
}

/* =========================================
   REGISTER USER
========================================= */

const registerUser = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            password
        } = req.body;

        if (
            !name ||
            !email ||
            !phone ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email, phone and password are required."
            });
        }

        const cleanName =
            String(name).trim();

        const cleanEmail =
            normalizeEmail(email);

        const cleanPhone =
            String(phone)
                .replace(/\D/g, "");

        if (cleanName.length < 2) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid full name."
            });
        }

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid email address."
            });
        }

        if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
            return res.status(400).json({
                success: false,
                message:
                    "Enter a valid Indian 10-digit mobile number."
            });
        }

        if (String(password).length < 8) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must contain at least 8 characters."
            });
        }

        const existingUser =
            await User.findOne({
                email: cleanEmail
            });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message:
                    "An account already exists with this email."
            });
        }

        const hashedPassword =
            await bcrypt.hash(
                String(password),
                10
            );

        const user =
            await User.create({
                name: cleanName,
                email: cleanEmail,
                phone: cleanPhone,
                password: hashedPassword
            });

        return res.status(201).json({
            success: true,
            message:
                "Registration successful.",

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });

    } catch (error) {
        console.error(
            "Register user error:",
            error
        );

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message:
                    "An account already exists with this email."
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to register. Please try again."
        });
    }
};

/* =========================================
   LOGIN USER
========================================= */

const loginUser = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required."
            });
        }

        const cleanEmail =
            normalizeEmail(email);

        const user =
            await User.findOne({
                email: cleanEmail
            });

        if (!user) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid email or password."
            });
        }

        const isPasswordCorrect =
            await bcrypt.compare(
                String(password),
                user.password
            );

        if (!isPasswordCorrect) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid email or password."
            });
        }

        const token =
            generateLoginToken(user);

        return res.status(200).json({
            success: true,
            message:
                "Login successful.",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });

    } catch (error) {
        console.error(
            "Login user error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to login. Please try again."
        });
    }
};

/* =========================================
   FORGOT PASSWORD
========================================= */

const forgotPassword = async (req, res) => {
    try {
        const email =
            normalizeEmail(req.body.email);

        if (!email) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter your registered email address."
            });
        }

        const user =
            await User.findOne({ email });

        /*
           Same response user exist aina,
           exist kakapoyina return chestham.
           Dini valla account information
           public ga reveal avvadu.
        */
        const safeResponseMessage =
            "If an account exists with this email, a password reset link will be sent.";

        if (!user) {
            return res.status(200).json({
                success: true,
                message:
                    safeResponseMessage
            });
        }

        /*
           Raw reset token email link lo untundi.
        */
        const resetToken =
            crypto
                .randomBytes(32)
                .toString("hex");

        /*
           Database lo raw token store cheyyakunda
           hashed token store chestham.
        */
        const hashedResetToken =
            crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");

        user.resetPasswordToken =
            hashedResetToken;

        /*
           Reset link 15 minutes valid.
        */
        user.resetPasswordExpire =
            Date.now() +
            15 * 60 * 1000;

        await user.save();

        const frontendURL =
            (
                process.env.FRONTEND_URL ||
                "http://127.0.0.1:5500/frontend"
            ).replace(/\/$/, "");

        const resetURL =
            `${frontendURL}/reset-password.html?token=${resetToken}`;

        try {
            const transporter =
                createEmailTransporter();

            await transporter.sendMail({
                from:
                    process.env.EMAIL_FROM ||
                    `"Sri Laxmi Home Foods" <${process.env.EMAIL_USER}>`,

                to: user.email,

                subject:
                    "Reset Your Sri Laxmi Home Foods Password",

                text:
                    `Hello ${user.name},

We received a request to reset your password.

Open this link to create a new password:

${resetURL}

This link will expire in 15 minutes.

If you did not request a password reset, you can ignore this email.

Sri Laxmi Home Foods`,

                html: `
                    <div style="
                        max-width: 600px;
                        margin: auto;
                        padding: 25px;
                        font-family: Arial, sans-serif;
                        color: #333333;
                        border: 1px solid #eeeeee;
                        border-radius: 12px;
                    ">
                        <h2 style="
                            color: #8b0000;
                            text-align: center;
                        ">
                            Sri Laxmi Home Foods
                        </h2>

                        <p>
                            Hello ${user.name},
                        </p>

                        <p>
                            We received a request to reset
                            your account password.
                        </p>

                        <p style="text-align: center;">
                            <a
                                href="${resetURL}"
                                style="
                                    display: inline-block;
                                    padding: 13px 24px;
                                    color: #ffffff;
                                    background: #8b0000;
                                    border-radius: 8px;
                                    text-decoration: none;
                                    font-weight: bold;
                                "
                            >
                                Reset Password
                            </a>
                        </p>

                        <p>
                            This reset link is valid for
                            <strong>15 minutes</strong>.
                        </p>

                        <p>
                            If you did not request this,
                            you can safely ignore this email.
                        </p>
                    </div>
                `
            });

            return res.status(200).json({
                success: true,
                message:
                    safeResponseMessage
            });

        } catch (emailError) {
            user.resetPasswordToken = null;
            user.resetPasswordExpire = null;

            await user.save();

            console.error(
                "Password reset email error:",
                emailError
            );

            return res.status(500).json({
                success: false,
                message:
                    "Reset email could not be sent. Please try again."
            });
        }

    } catch (error) {
        console.error(
            "Forgot password error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to process password reset request."
        });
    }
};

/* =========================================
   RESET PASSWORD
========================================= */

const resetPassword = async (req, res) => {
    try {
        const resetToken =
            req.params.token;

        const {
            password,
            confirmPassword
        } = req.body;

        if (!resetToken) {
            return res.status(400).json({
                success: false,
                message:
                    "Password reset token is missing."
            });
        }

        if (!password) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter your new password."
            });
        }

        if (String(password).length < 8) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must contain at least 8 characters."
            });
        }

        if (
            confirmPassword &&
            password !== confirmPassword
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Password and confirm password do not match."
            });
        }

        const hashedResetToken =
            crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");

        const user =
            await User.findOne({
                resetPasswordToken:
                    hashedResetToken,

                resetPasswordExpire: {
                    $gt: Date.now()
                }
            });

        if (!user) {
            return res.status(400).json({
                success: false,
                message:
                    "Reset link is invalid or has expired. Please request a new link."
            });
        }

        user.password =
            await bcrypt.hash(
                String(password),
                10
            );

        user.resetPasswordToken = null;
        user.resetPasswordExpire = null;

        await user.save();

        return res.status(200).json({
            success: true,
            message:
                "Password reset successful. You can now login with your new password."
        });

    } catch (error) {
        console.error(
            "Reset password error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to reset password. Please try again."
        });
    }
};

/* =========================================
   EXPORTS
========================================= */

module.exports = {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword
};