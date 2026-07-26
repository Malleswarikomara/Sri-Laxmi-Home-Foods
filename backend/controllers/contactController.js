const mongoose = require("mongoose");
const Contact = require("../models/ContactModel");

/* =========================================
   CREATE CONTACT MESSAGE — PUBLIC
========================================= */

const createContactMessage = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            subject,
            message
        } = req.body || {};

        const cleanName =
            String(name || "").trim();

        const cleanEmail =
            String(email || "")
                .trim()
                .toLowerCase();

        const cleanPhone =
            String(phone || "").trim();

        const phoneDigits =
            cleanPhone.replace(/\D/g, "");

        const cleanSubject =
            String(
                subject || "General Enquiry"
            ).trim();

        const cleanMessage =
            String(message || "").trim();

        /* =====================================
           REQUIRED FIELD VALIDATION
        ===================================== */

        if (
            !cleanName ||
            !cleanEmail ||
            !cleanPhone ||
            !cleanMessage
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email, phone number and message are required."
            });
        }

        /* =====================================
           NAME VALIDATION
        ===================================== */

        if (
            cleanName.length < 2 ||
            cleanName.length > 80
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name must contain between 2 and 80 characters."
            });
        }

        /* =====================================
           EMAIL VALIDATION
        ===================================== */

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            !emailPattern.test(cleanEmail) ||
            cleanEmail.length > 120
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid email address."
            });
        }

        /* =====================================
           PHONE VALIDATION
        ===================================== */

        if (
            phoneDigits.length < 10 ||
            phoneDigits.length > 15
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid phone number."
            });
        }

        /* =====================================
           SUBJECT VALIDATION
        ===================================== */

        if (cleanSubject.length > 150) {
            return res.status(400).json({
                success: false,
                message:
                    "Subject must not exceed 150 characters."
            });
        }

        /* =====================================
           MESSAGE VALIDATION
        ===================================== */

        if (cleanMessage.length < 5) {
            return res.status(400).json({
                success: false,
                message:
                    "Message must contain at least 5 characters."
            });
        }

        if (cleanMessage.length > 2000) {
            return res.status(400).json({
                success: false,
                message:
                    "Message must not exceed 2000 characters."
            });
        }

        /* =====================================
           CREATE CONTACT MESSAGE
        ===================================== */

        const contact = await Contact.create({
            name: cleanName,
            email: cleanEmail,
            phone: phoneDigits,
            subject:
                cleanSubject ||
                "General Enquiry",
            message: cleanMessage,
            status: "New"
        });

        return res.status(201).json({
            success: true,
            message:
                "Your message has been submitted successfully.",
            contact
        });
    } catch (error) {
        console.error(
            "Create contact message error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to submit your message. Please try again."
        });
    }
};

/* =========================================
   GET ALL CONTACT MESSAGES — ADMIN
========================================= */

const getContactMessages = async (
    req,
    res
) => {
    try {
        const contacts =
            await Contact.find()
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({
            success: true,
            count: contacts.length,
            contacts
        });
    } catch (error) {
        console.error(
            "Get contact messages error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load contact messages."
        });
    }
};

/* =========================================
   UPDATE CONTACT STATUS — ADMIN
========================================= */

const updateContactStatus = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const status =
            String(
                req.body?.status || ""
            ).trim();

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid contact message ID."
            });
        }

        const allowedStatuses = [
            "New",
            "Read",
            "Replied"
        ];

        if (
            !allowedStatuses.includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Status must be New, Read or Replied."
            });
        }

        const contact =
            await Contact.findByIdAndUpdate(
                id,
                {
                    $set: {
                        status
                    }
                },
                {
                    new: true,
                    runValidators: true
                }
            );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message:
                    "Contact message not found."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Contact status updated successfully.",
            contact
        });
    } catch (error) {
        console.error(
            "Update contact status error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to update contact status."
        });
    }
};

/* =========================================
   EXPORT CONTROLLERS
========================================= */

module.exports = {
    createContactMessage,
    getContactMessages,
    updateContactStatus
};