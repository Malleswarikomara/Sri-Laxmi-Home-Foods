const Order = require("../models/order");
const Food = require("../models/Food");
const mongoose = require("mongoose");
// Customer: Place new order
const placeOrder = async (req, res) => {
    try {
        const { items } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Your cart is empty"
            });
        }

        const foodIds = items.map((item) => item.foodId);

        const hasInvalidFoodId = foodIds.some(
            (foodId) =>
                !mongoose.Types.ObjectId.isValid(foodId)
        );

        if (hasInvalidFoodId) {
            return res.status(400).json({
                success: false,
                message: "Cart contains an invalid food item"
            });
        }

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
            const food = foodMap.get(
                String(item.foodId)
            );

            if (!food) {
                return res.status(400).json({
                    success: false,
                    message:
                        `${item.name || "A food item"} was deleted. Remove it from your cart.`
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
                quantity < 1
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Invalid quantity for ${food.name}`
                });
            }

            verifiedItems.push({
                foodId: food._id,
                name: food.name,
                price: food.price,
                quantity
            });
        }

        const totalAmount =
            verifiedItems.reduce(
                (total, item) =>
                    total +
                    item.price * item.quantity,
                0
            );

        const order = await Order.create({
            ...req.body,
            user: req.user.id,
            items: verifiedItems,
            totalAmount
        });

        res.status(201).json({
            success: true,
            message: "Order Placed Successfully",
            order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// Customer: Get logged-in user's orders
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            user: req.user.id
        }).sort({
            createdAt: -1
        });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Admin: Get all customer orders
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("user", "name email phone")
            .sort({
                createdAt: -1
            });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Admin: Update order status
const updateOrderStatus = async (req, res) => {
    try {
        const { orderStatus } = req.body;

        const allowedStatuses = [
            "Pending",
            "Confirmed",
            "Preparing",
            "Out for Delivery",
            "Delivered",
            "Cancelled"
        ];

        if (!allowedStatuses.includes(orderStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status"
            });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    orderStatus: orderStatus
                }
            },
            {
                new: true,
                runValidators: false
            }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const cancelMyOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const userId =
            req.user?._id || req.user?.id;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID."
            });
        }

        const order = await Order.findOne({
            _id: id,
            user: userId
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found."
            });
        }

        if (order.orderStatus !== "Pending") {
            return res.status(400).json({
                success: false,
                message:
                    "Only pending orders can be cancelled."
            });
        }

        order.orderStatus = "Cancelled";

        await order.save();

        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully.",
            order
        });
    } catch (error) {
        console.error(
            "Cancel order error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to cancel order."
        });
    }
};
module.exports = {
    placeOrder,
    getMyOrders,
    getAllOrders,
    updateOrderStatus,
    cancelMyOrder
};