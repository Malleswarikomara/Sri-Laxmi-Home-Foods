const mongoose = require("mongoose");
const Contact = require("../models/ContactModel");

/* =========================================
   CREATE CONTACT MESSAGE
========================================= */

const createContactMessage = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            subject,
            message
        } = req.body;

        if (!name || !email || !phone || !message) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email, phone number and message are required."
            });
        }

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid email address."
            });
        }

        const phoneDigits =
            String(phone).replace(/\D/g, "");

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

        const contact = await Contact.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            subject:
                subject?.trim() || "General Enquiry",
            message: message.trim()
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
                "Unable to submit your message."
        });
    }
};

/* =========================================
   GET ALL CONTACT MESSAGES — ADMIN
========================================= */

const getContactMessages = async (req, res) => {
    try {
        const contacts = await Contact.find()
            .sort({ createdAt: -1 });

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

const updateContactStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid contact message ID."
            });
        }

        const allowedStatuses = [
            "New",
            "Read",
            "Replied"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message:
                    "Status must be New, Read or Replied."
            });
        }

        const contact = await Contact.findByIdAndUpdate(
            id,
            { status },
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

module.exports = {
    createContactMessage,
    getContactMessages,
    updateContactStatus
};