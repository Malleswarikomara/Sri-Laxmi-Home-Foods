const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const uploadFoodImageMiddleware =
    require("../middleware/uploadMiddleware");

const {
    getFoods,
    getFoodById,
    addFood,
    updateFood,
    deleteFood,
    uploadFoodImage
} = require("../controllers/foodController");

// Public: Get all food items
router.get("/", getFoods);

// Admin: Upload food image
// Ee route /:id route paina undali
router.post(
    "/upload-image",
    protect,
    adminOnly,
    uploadFoodImageMiddleware.single("image"),
    uploadFoodImage
);

// Admin: Add new food item
router.post(
    "/",
    protect,
    adminOnly,
    addFood
);

// Admin: Update food item
router.patch(
    "/:id",
    protect,
    adminOnly,
    updateFood
);

// Admin: Delete food item
router.delete(
    "/:id",
    protect,
    adminOnly,
    deleteFood
);

// Public: Get single food item
// Ee route last lo undali
router.get("/:id", getFoodById);

module.exports = router;