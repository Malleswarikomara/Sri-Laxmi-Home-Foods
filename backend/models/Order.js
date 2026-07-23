const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
},

    customerName: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true
    },

    email: {
        type: String
    },

    address: {
        house: String,
        street: String,
        area: String,
        landmark: String,
        city: String,
        pincode: String
    },

    location: {
        latitude: Number,
        longitude: Number
    },

    items: [
        {
            foodId: String,
            name: String,
            price: Number,
            quantity: Number
        }
    ],

    totalAmount: {
        type: Number,
        required: true
    },

    paymentMethod: {
        type: String,
        enum: ["COD", "ONLINE"],
        default: "COD"
    },

    orderStatus: {
        type: String,
         enum: [
        "Pending",
        "Confirmed",
        "Preparing",
        "Out for Delivery",
        "Delivered",
        "Cancelled"
    ],
        default: "Pending"
    }

},{
    timestamps:true
});

module.exports = mongoose.model("Order", orderSchema);
