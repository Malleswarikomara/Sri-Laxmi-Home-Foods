const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: 2,
            maxlength: 60
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            lowercase: true
        },

        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true
        },

        subject: {
            type: String,
            trim: true,
            maxlength: 100,
            default: "General Enquiry"
        },

        message: {
            type: String,
            required: [true, "Message is required"],
            trim: true,
            minlength: 5,
            maxlength: 1000
        },

        status: {
            type: String,
            enum: ["New", "Read", "Replied"],
            default: "New"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Contact", contactSchema);