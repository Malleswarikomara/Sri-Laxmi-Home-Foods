const mongoose = require("mongoose");

const Food = require("../models/Food");
const cloudinary = require("../config/cloudinary");

/* =========================================
   HELPERS
========================================= */

function configureCloudinary() {
    const {
        CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET
    } = process.env;

    if (
        !CLOUDINARY_CLOUD_NAME ||
        !CLOUDINARY_API_KEY ||
        !CLOUDINARY_API_SECRET
    ) {
        throw new Error(
            "Cloudinary credentials are missing in the .env file."
        );
    }

    cloudinary.config({
        cloud_name:
            CLOUDINARY_CLOUD_NAME,

        api_key:
            CLOUDINARY_API_KEY,

        api_secret:
            CLOUDINARY_API_SECRET,

        secure: true
    });
}

function parseAvailableValue(
    value,
    defaultValue = true
) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return defaultValue;
    }

    if (typeof value === "boolean") {
        return value;
    }

    const normalizedValue =
        String(value)
            .trim()
            .toLowerCase();

    return [
        "true",
        "1",
        "yes",
        "on",
        "available"
    ].includes(normalizedValue);
}

function isValidFoodId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

/* =========================================
   CLOUDINARY UPLOAD
========================================= */

function uploadBufferToCloudinary(fileBuffer) {
    return new Promise(
        function (resolve, reject) {
            const uploadStream =
                cloudinary.uploader.upload_stream(
                    {
                        folder:
                            "sri-laxmi-home-foods/foods",

                        resource_type:
                            "image",

                        unique_filename:
                            true,

                        overwrite:
                            false
                    },

                    function (
                        error,
                        uploadResult
                    ) {
                        if (error) {
                            reject(error);
                            return;
                        }

                        resolve(uploadResult);
                    }
                );

            uploadStream.end(fileBuffer);
        }
    );
}

/* =========================================
   PUBLIC: GET ALL FOODS
========================================= */

const getFoods = async (req, res) => {
    try {
        const foods =
            await Food.find()
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({
            success: true,
            count: foods.length,
            foods
        });

    } catch (error) {
        console.error(
            "Get foods error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load food items."
        });
    }
};

/* =========================================
   PUBLIC: GET ONE FOOD
========================================= */

const getFoodById = async (req, res) => {
    try {
        if (
            !isValidFoodId(req.params.id)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid food item ID."
            });
        }

        const food =
            await Food.findById(
                req.params.id
            );

        if (!food) {
            return res.status(404).json({
                success: false,
                message:
                    "Food item not found."
            });
        }

        return res.status(200).json({
            success: true,
            food
        });

    } catch (error) {
        console.error(
            "Get food by ID error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load the food item."
        });
    }
};

/* =========================================
   ADMIN: ADD FOOD
========================================= */

const addFood = async (req, res) => {
    try {
        const {
            name,
            category,
            price,
            description,
            image,
            imagePublicId,
            available
        } = req.body;

        if (
            !name ||
            !category ||
            price === undefined ||
            price === null ||
            price === ""
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, category and price are required."
            });
        }

        const numericPrice =
            Number(price);

        if (
            Number.isNaN(numericPrice) ||
            numericPrice <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid price greater than zero."
            });
        }

        const food =
            await Food.create({
                name:
                    String(name).trim(),

                category:
                    String(category).trim(),

                price:
                    numericPrice,

                description:
                    description
                        ? String(
                            description
                        ).trim()
                        : "",

                image:
                    image
                        ? String(image).trim()
                        : "",

                imagePublicId:
                    imagePublicId
                        ? String(
                            imagePublicId
                        ).trim()
                        : "",

                available:
                    parseAvailableValue(
                        available,
                        true
                    )
            });

        return res.status(201).json({
            success: true,
            message:
                "Food item added successfully.",
            food
        });

    } catch (error) {
        console.error(
            "Add food error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to add food item."
        });
    }
};

/* =========================================
   ADMIN: UPDATE FOOD
========================================= */

const updateFood = async (req, res) => {
    try {
        if (
            !isValidFoodId(req.params.id)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid food item ID."
            });
        }

        const food =
            await Food.findById(
                req.params.id
            );

        if (!food) {
            return res.status(404).json({
                success: false,
                message:
                    "Food item not found."
            });
        }

        if (
            req.body.name !== undefined
        ) {
            const name =
                String(req.body.name)
                    .trim();

            if (!name) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Food name cannot be empty."
                    });
            }

            food.name = name;
        }

        if (
            req.body.category !==
            undefined
        ) {
            const category =
                String(
                    req.body.category
                ).trim();

            if (!category) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Food category cannot be empty."
                    });
            }

            food.category =
                category;
        }

        if (
            req.body.price !== undefined
        ) {
            const numericPrice =
                Number(req.body.price);

            if (
                Number.isNaN(
                    numericPrice
                ) ||
                numericPrice <= 0
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Please enter a valid price greater than zero."
                    });
            }

            food.price =
                numericPrice;
        }

        if (
            req.body.description !==
            undefined
        ) {
            food.description =
                String(
                    req.body.description ||
                    ""
                ).trim();
        }

        if (
            req.body.image !== undefined
        ) {
            food.image =
                String(
                    req.body.image ||
                    ""
                ).trim();
        }

        if (
            req.body.imagePublicId !==
            undefined
        ) {
            /*
               New image upload chesinappudu
               old Cloudinary image remove chestundi.
            */

            const oldPublicId =
                food.imagePublicId;

            const newPublicId =
                String(
                    req.body
                        .imagePublicId ||
                    ""
                ).trim();

            food.imagePublicId =
                newPublicId;

            if (
                oldPublicId &&
                newPublicId &&
                oldPublicId !== newPublicId
            ) {
                try {
                    configureCloudinary();

                    await cloudinary
                        .uploader
                        .destroy(
                            oldPublicId,
                            {
                                resource_type:
                                    "image",

                                invalidate:
                                    true
                            }
                        );

                } catch (
                    cloudinaryDeleteError
                ) {
                    console.error(
                        "Old Cloudinary image delete error:",
                        cloudinaryDeleteError
                    );
                }
            }
        }

        if (
            req.body.available !==
            undefined
        ) {
            food.available =
                parseAvailableValue(
                    req.body.available,
                    food.available
                );
        }

        await food.save();

        return res.status(200).json({
            success: true,
            message:
                "Food item updated successfully.",
            food
        });

    } catch (error) {
        console.error(
            "Update food error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to update food item."
        });
    }
};

/* =========================================
   ADMIN: DELETE FOOD
========================================= */

const deleteFood = async (req, res) => {
    try {
        if (
            !isValidFoodId(req.params.id)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid food item ID."
            });
        }

        const food =
            await Food.findById(
                req.params.id
            );

        if (!food) {
            return res.status(404).json({
                success: false,
                message:
                    "Food item not found."
            });
        }

        /*
           Food Cloudinary image remove.
        */

        if (food.imagePublicId) {
            try {
                configureCloudinary();

                await cloudinary
                    .uploader
                    .destroy(
                        food.imagePublicId,
                        {
                            resource_type:
                                "image",

                            invalidate:
                                true
                        }
                    );

            } catch (
                cloudinaryDeleteError
            ) {
                console.error(
                    "Cloudinary image delete error:",
                    cloudinaryDeleteError
                );
            }
        }

        await food.deleteOne();

        return res.status(200).json({
            success: true,
            message:
                "Food item deleted successfully."
        });

    } catch (error) {
        console.error(
            "Delete food error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to delete food item."
        });
    }
};

/* =========================================
   ADMIN: UPLOAD FOOD IMAGE
========================================= */

const uploadFoodImage = async (
    req,
    res
) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message:
                    "Please select an image."
            });
        }

        configureCloudinary();

        const uploadResult =
            await uploadBufferToCloudinary(
                req.file.buffer
            );

        return res.status(200).json({
            success: true,
            message:
                "Food image uploaded successfully.",

            imageUrl:
                uploadResult.secure_url,

            imagePublicId:
                uploadResult.public_id
        });

    } catch (error) {
        console.error(
            "Cloudinary food image upload error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to upload food image."
        });
    }
};

/* =========================================
   EXPORTS
========================================= */

module.exports = {
    getFoods,
    getFoodById,
    addFood,
    updateFood,
    deleteFood,
    uploadFoodImage
};