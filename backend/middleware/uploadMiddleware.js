const multer = require("multer");

/* =========================================
   MEMORY STORAGE
   Image local uploads folder lo save local uploads folder lo save avvadu.
   req.file.buffer lo temporary ga untundi.
========================================= */

const storage = multer.memoryStorage();

/* =========================================
   IMAGE FILE VALIDATION
========================================= */

const fileFilter = (req, file, callback) => {
    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ];

    if (allowedTypes.includes(file.mimetype)) {
        callback(null, true);
    } else {
        callback(
            new Error(
                "Only JPG, JPEG, PNG and WEBP images are allowed."
            ),
            false
        );
    }
};

/* =========================================
   MULTER CONFIGURATION
========================================= */

const uploadFoodImage = multer({
    storage,

    fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

module.exports = uploadFoodImage;