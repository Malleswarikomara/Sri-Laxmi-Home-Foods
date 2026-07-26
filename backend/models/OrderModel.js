const mongoose = require("mongoose");

const Order = require("../models/OrderModel");
const Food = require("../models/Food");

/* =========================================
   CUSTOMER: PLACE NEW ORDER
========================================= */

const placeOrder = async (req, res) => {
    try {
        const {
            customerName,
            phone,
            email,
            address,
            location,
            items,
            paymentMethod
        } = req.body || {};

        /* =====================================
           CUSTOMER NAME VALIDATION
        ===================================== */

        const cleanCustomerName =
            String(customerName || "").trim();

        if (!cleanCustomerName) {
            return res.status(400).json({
                success: false,
                message: "Customer name is required."
            });
        }

        if (cleanCustomerName.length < 2) {
            return res.status(400).json({
                success: false,
                message:
                    "Customer name must contain at least 2 characters."
            });
        }

        /* =====================================
           PHONE VALIDATION
        ===================================== */

        const cleanPhone =
            String(phone || "").replace(/\D/g, "");

        if (
            cleanPhone.length < 10 ||
            cleanPhone.length > 15
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid phone number."
            });
        }

        /* =====================================
           EMAIL VALIDATION
        ===================================== */

        const cleanEmail =
            String(email || "")
                .trim()
                .toLowerCase();

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            cleanEmail &&
            !emailPattern.test(cleanEmail)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid email address."
            });
        }

        /* =====================================
           ADDRESS VALIDATION
        ===================================== */

        if (!address || typeof address !== "object") {
            return res.status(400).json({
                success: false,
                message:
                    "Delivery address is required."
            });
        }

        const cleanHouse =
            String(address.house || "").trim();

        const cleanStreet =
            String(address.street || "").trim();

        const cleanArea =
            String(address.area || "").trim();

        const cleanLandmark =
            String(address.landmark || "").trim();

        const cleanCity =
            String(address.city || "").trim();

        const cleanPincode =
            String(address.pincode || "")
                .replace(/\D/g, "");

        if (!cleanHouse) {
            return res.status(400).json({
                success: false,
                message:
                    "House or flat number is required."
            });
        }

        if (!cleanArea) {
            return res.status(400).json({
                success: false,
                message:
                    "Delivery area is required."
            });
        }

        if (!cleanCity) {
            return res.status(400).json({
                success: false,
                message:
                    "Delivery city is required."
            });
        }

        if (
            cleanCity.toLowerCase() !==
            "hyderabad"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Delivery is currently available only in Hyderabad."
            });
        }

        if (cleanPincode.length !== 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid 6-digit pincode."
            });
        }

        /* =====================================
           PAYMENT VALIDATION
        ===================================== */

        const selectedPaymentMethod =
            String(paymentMethod || "COD")
                .trim()
                .toUpperCase();

        if (selectedPaymentMethod !== "COD") {
            return res.status(400).json({
                success: false,
                message:
                    "Online payment is not available yet. Please select Cash on Delivery."
            });
        }

        /* =====================================
           CART VALIDATION
        ===================================== */

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Your cart is empty."
            });
        }

        const foodIds = items.map(
            (item) => item.foodId
        );

        const hasInvalidFoodId =
            foodIds.some(
                (foodId) =>
                    !mongoose.Types.ObjectId.isValid(
                        foodId
                    )
            );

        if (hasInvalidFoodId) {
            return res.status(400).json({
                success: false,
                message:
                    "Your cart contains an invalid food item."
            });
        }

        /* =====================================
           GET FOODS FROM DATABASE
        ===================================== */

        const foods = await Food.find({
            _id: {
                $in: foodIds
            }
        });

        const foodMap = new Map(
            foods.map((food) => [
                food._id.toString(),
                food
            ])
        );

        const verifiedItems = [];

        for (const item of items) {
            const foodId =
                String(item.foodId);

            const food =
                foodMap.get(foodId);

            if (!food) {
                return res.status(400).json({
                    success: false,
                    message:
                        `${
                            item.name ||
                            "A food item"
                        } was removed. Please remove it from your cart.`
                });
            }

            if (!food.available) {
                return res.status(400).json({
                    success: false,
                    message:
                        `${food.name} is currently unavailable.`
                });
            }

            const quantity =
                Number(item.quantity);

            if (
                !Number.isInteger(quantity) ||
                quantity < 1 ||
                quantity > 50
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Please enter a valid quantity for ${food.name}.`
                });
            }

            const foodPrice =
                Number(food.price);

            if (
                !Number.isFinite(foodPrice) ||
                foodPrice < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Invalid price found for ${food.name}.`
                });
            }

            verifiedItems.push({
                foodId:
                    food._id.toString(),

                name:
                    String(food.name).trim(),

                price:
                    foodPrice,

                quantity
            });
        }

        /* =====================================
           CALCULATE TOTAL ON BACKEND
        ===================================== */

        const totalAmount =
            verifiedItems.reduce(
                (total, item) =>
                    total +
                    item.price *
                        item.quantity,
                0
            );

        /* =====================================
           LOCATION VALIDATION
        ===================================== */

        let safeLocation;

        if (location) {
            const latitude =
                Number(location.latitude);

            const longitude =
                Number(location.longitude);

            if (
                Number.isFinite(latitude) &&
                Number.isFinite(longitude) &&
                latitude >= -90 &&
                latitude <= 90 &&
                longitude >= -180 &&
                longitude <= 180
            ) {
                safeLocation = {
                    latitude,
                    longitude
                };
            }
        }

        /* =====================================
           CREATE SAFE ORDER
        ===================================== */

        const orderData = {
            user: req.user.id,

            customerName:
                cleanCustomerName,

            phone:
                cleanPhone,

            email:
                cleanEmail,

            address: {
                house:
                    cleanHouse,

                street:
                    cleanStreet,

                area:
                    cleanArea,

                landmark:
                    cleanLandmark,

                city:
                    "Hyderabad",

                pincode:
                    cleanPincode
            },

            items:
                verifiedItems,

            totalAmount,

            paymentMethod:
                "COD",

            orderStatus:
                "Pending"
        };

        if (safeLocation) {
            orderData.location =
                safeLocation;
        }

        const order =
            await Order.create(orderData);

        return res.status(201).json({
            success: true,
            message:
                "Order placed successfully.",
            order
        });
    } catch (error) {
        console.error(
            "Place order error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to place the order. Please try again."
        });
    }
};

/* =========================================
   CUSTOMER: GET MY ORDERS
========================================= */

const getMyOrders = async (req, res) => {
    try {
        const orders =
            await Order.find({
                user: req.user.id
            }).sort({
                createdAt: -1
            });

        return res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        console.error(
            "Get my orders error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load your orders."
        });
    }
};

/* =========================================
   ADMIN: GET ALL ORDERS
========================================= */

const getAllOrders = async (req, res) => {
    try {
        const orders =
            await Order.find()
                .populate(
                    "user",
                    "name email phone"
                )
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        console.error(
            "Get all orders error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load customer orders."
        });
    }
};

/* =========================================
   ADMIN: UPDATE ORDER STATUS
========================================= */

const updateOrderStatus = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const { orderStatus } =
            req.body || {};

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID."
            });
        }

        const allowedStatuses = [
            "Pending",
            "Confirmed",
            "Preparing",
            "Out for Delivery",
            "Delivered",
            "Cancelled"
        ];

        if (
            !allowedStatuses.includes(
                orderStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid order status."
            });
        }

        const order =
            await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found."
            });
        }

        order.orderStatus =
            orderStatus;

        await order.save();

        return res.status(200).json({
            success: true,
            message:
                "Order status updated successfully.",
            order
        });
    } catch (error) {
        console.error(
            "Update order status error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to update order status."
        });
    }
};

/* =========================================
   CUSTOMER: CANCEL OWN PENDING ORDER
========================================= */

const cancelMyOrder = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const userId =
            req.user?.id ||
            req.user?._id;

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID."
            });
        }

        const order =
            await Order.findOne({
                _id: id,
                user: userId
            });

        if (!order) {
            return res.status(404).json({
                success: false,
                message:
                    "Order not found or you do not have permission to cancel it."
            });
        }

        if (
            order.orderStatus !== "Pending"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Only pending orders can be cancelled."
            });
        }

        order.orderStatus =
            "Cancelled";

        await order.save();

        return res.status(200).json({
            success: true,
            message:
                "Order cancelled successfully.",
            order
        });
    } catch (error) {
        console.error(
            "Cancel order error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to cancel the order."
        });
    }
};

/* =========================================
   EXPORT CONTROLLERS
========================================= */

module.exports = {
    placeOrder,
    getMyOrders,
    getAllOrders,
    updateOrderStatus,
    cancelMyOrder
};