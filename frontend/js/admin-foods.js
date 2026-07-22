const FOOD_API =
    "http://localhost:5000/api/foods";

const FOOD_IMAGE_UPLOAD_API =
    "http://localhost:5000/api/foods/upload-image";

const PLACEHOLDER_IMAGE =
    "images/food-placeholder.jpg";

/* =========================================
   FORM ELEMENTS
========================================= */

const adminFoodForm =
    document.getElementById("adminFoodForm");

const foodIdInput =
    document.getElementById("foodId");

const foodNameInput =
    document.getElementById("foodName");

const foodCategoryInput =
    document.getElementById("foodCategory");

const foodPriceInput =
    document.getElementById("foodPrice");

const foodDescriptionInput =
    document.getElementById(
        "foodDescription"
    );

const foodAvailableInput =
    document.getElementById(
        "foodAvailable"
    );

const foodImageFileInput =
    document.getElementById(
        "foodImageFile"
    );

const foodImageUrlInput =
    document.getElementById(
        "foodImage"
    );

const foodImagePreview =
    document.getElementById(
        "foodImagePreview"
    );

const imageUploadMessage =
    document.getElementById(
        "imageUploadMessage"
    );

/* =========================================
   PAGE ELEMENTS
========================================= */

const foodFormTitle =
    document.getElementById(
        "foodFormTitle"
    );

const foodSubmitButton =
    document.getElementById(
        "foodSubmitButton"
    );

const cancelEditButton =
    document.getElementById(
        "cancelEditButton"
    );

const adminFoodsContainer =
    document.getElementById(
        "adminFoodsContainer"
    );

const adminFoodMessage =
    document.getElementById(
        "adminFoodMessage"
    );

const adminFoodCount =
    document.getElementById(
        "adminFoodCount"
    );

/* =========================================
   GLOBAL VARIABLES
========================================= */

let adminFoods = [];

let previewObjectUrl = null;

/*
   Cloudinary image public ID.
   Image update/delete kosam backend use chestundi.
*/
let currentImagePublicId = "";

/* =========================================
   ADMIN LOGIN PROTECTION
========================================= */

function getAdminAuthentication() {
    const token =
        localStorage.getItem("token");

    const storedUser =
        localStorage.getItem("user");

    if (!token || !storedUser) {
        alert("Please login as admin.");

        window.location.replace(
            "login.html"
        );

        return null;
    }

    try {
        const user =
            JSON.parse(storedUser);

        const role =
            String(user.role || "")
                .trim()
                .toLowerCase();

        if (role !== "admin") {
            alert("Admin access only.");

            window.location.replace(
                "profile.html"
            );

            return null;
        }

        return {
            token,
            user
        };

    } catch (error) {
        console.error(
            "Admin login data error:",
            error
        );

        clearAdminLogin();

        alert(
            "Login information is invalid. Please login again."
        );

        window.location.replace(
            "login.html"
        );

        return null;
    }
}

function clearAdminLogin() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
}

/* =========================================
   HELPERS
========================================= */

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function readResponseData(response) {
    const responseText =
        await response.text();

    try {
        return JSON.parse(responseText);
    } catch (error) {
        return {
            success: false,

            message:
                responseText ||
                `Request failed with status ${response.status}`
        };
    }
}

function handleUnauthorizedResponse(
    response,
    data
) {
    if (
        response.status !== 401 &&
        response.status !== 403
    ) {
        return false;
    }

    clearAdminLogin();

    alert(
        data.message ||
        "Your admin session has expired. Please login again."
    );

    window.location.replace(
        "login.html"
    );

    return true;
}

function getFoodImage(food) {
    return (
        food.image ||
        PLACEHOLDER_IMAGE
    );
}

function setPageMessage(
    message,
    isError = false
) {
    if (!adminFoodMessage) {
        return;
    }

    adminFoodMessage.style.display =
        "block";

    adminFoodMessage.textContent =
        message;

    adminFoodMessage.style.color =
        isError
            ? "#b00020"
            : "#6f625e";
}

function setImageMessage(
    message,
    type = "normal"
) {
    if (!imageUploadMessage) {
        return;
    }

    imageUploadMessage.textContent =
        message;

    if (type === "success") {
        imageUploadMessage.style.color =
            "#166534";
    } else if (type === "error") {
        imageUploadMessage.style.color =
            "#b00020";
    } else if (type === "warning") {
        imageUploadMessage.style.color =
            "#8a5900";
    } else {
        imageUploadMessage.style.color =
            "#6f625e";
    }
}

/* =========================================
   IMAGE VALIDATION
========================================= */

function validateImageFile(file) {
    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        alert(
            "Only JPG, JPEG, PNG and WEBP images are allowed."
        );

        return false;
    }

    const maximumSize =
        5 * 1024 * 1024;

    if (file.size > maximumSize) {
        alert(
            "Image size must be below 5 MB."
        );

        return false;
    }

    return true;
}

/* =========================================
   IMAGE PREVIEW
========================================= */

function showSelectedImagePreview() {
    const selectedFile =
        foodImageFileInput?.files?.[0];

    if (!selectedFile) {
        return;
    }

    if (!validateImageFile(selectedFile)) {
        foodImageFileInput.value = "";

        foodImagePreview.src =
            foodImageUrlInput.value ||
            PLACEHOLDER_IMAGE;

        return;
    }

    if (previewObjectUrl) {
        URL.revokeObjectURL(
            previewObjectUrl
        );
    }

    previewObjectUrl =
        URL.createObjectURL(
            selectedFile
        );

    foodImagePreview.src =
        previewObjectUrl;

    setImageMessage(
        "Image selected. Click Add Food or Update Food to upload.",
        "warning"
    );
}

/* =========================================
   UPLOAD IMAGE TO CLOUDINARY
========================================= */

async function uploadImageToServer(
    imageFile,
    token
) {
    const formData =
        new FormData();

    /*
       Backend Multer field name exact ga
       lowercase "image" undali.
    */
    formData.append(
        "image",
        imageFile
    );

    const response =
        await fetch(
            FOOD_IMAGE_UPLOAD_API,
            {
                method: "POST",

                headers: {
                    Authorization:
                        `Bearer ${token}`
                },

                body: formData
            }
        );

    const data =
        await readResponseData(response);

    if (
        handleUnauthorizedResponse(
            response,
            data
        )
    ) {
        throw new Error(
            "Admin session expired."
        );
    }

    if (
        !response.ok ||
        !data.success
    ) {
        throw new Error(
            data.message ||
            "Image upload failed."
        );
    }

    if (!data.imageUrl) {
        throw new Error(
            "Cloudinary image URL was not returned."
        );
    }

    return {
        imageUrl:
            data.imageUrl,

        imagePublicId:
            data.imagePublicId || ""
    };
}

/* =========================================
   LOAD FOOD ITEMS
========================================= */

async function loadAdminFoods() {
    setPageMessage(
        "Loading food items..."
    );

    try {
        const response =
            await fetch(FOOD_API);

        const data =
            await readResponseData(
                response
            );

        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                "Unable to load food items."
            );
        }

        adminFoods =
            Array.isArray(data.foods)
                ? data.foods
                : [];

        renderAdminFoods();

    } catch (error) {
        console.error(
            "Load foods error:",
            error
        );

        adminFoods = [];

        setPageMessage(
            error.message ||
            "Unable to load food items.",
            true
        );

        if (adminFoodCount) {
            adminFoodCount.textContent =
                "0 items";
        }
    }
}

/* =========================================
   FOOD CARD
========================================= */

function createAdminFoodCard(food) {
    const foodId =
        escapeHTML(food._id);

    const foodImage =
        escapeHTML(
            getFoodImage(food)
        );

    const foodName =
        escapeHTML(
            food.name || "Food Item"
        );

    const foodCategory =
        escapeHTML(
            food.category || "Other"
        );

    const foodDescription =
        escapeHTML(
            food.description ||
            "No description available."
        );

    const foodPrice =
        Number(food.price || 0);

    const isAvailable =
        food.available !== false;

    const availabilityText =
        isAvailable
            ? "Available"
            : "Unavailable";

    const availabilityClass =
        isAvailable
            ? "food-available"
            : "food-unavailable";

    return `
        <article class="admin-food-card">

            <img
                src="${foodImage}"
                alt="${foodName}"
                loading="lazy"
                onerror="
                    this.onerror = null;
                    this.src = '${PLACEHOLDER_IMAGE}';
                "
            >

            <div class="admin-food-card-content">

                <div class="admin-food-card-top">

                    <span>
                        ${foodCategory}
                    </span>

                    <strong
                        class="${availabilityClass}"
                    >
                        ${availabilityText}
                    </strong>

                </div>

                <h3>
                    ${foodName}
                </h3>

                <p>
                    ${foodDescription}
                </p>

                <div class="admin-food-price">
                    ₹${foodPrice}
                </div>

                <div class="admin-food-actions">

                    <button
                        type="button"
                        class="edit-food-button"
                        data-action="edit"
                        data-id="${foodId}"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="availability-button"
                        data-action="availability"
                        data-id="${foodId}"
                        data-available="${isAvailable}"
                    >
                        ${
                            isAvailable
                                ? "Make Unavailable"
                                : "Make Available"
                        }
                    </button>

                    <button
                        type="button"
                        class="delete-food-button"
                        data-action="delete"
                        data-id="${foodId}"
                    >
                        Delete
                    </button>

                </div>

            </div>

        </article>
    `;
}

function renderAdminFoods() {
    if (adminFoodCount) {
        adminFoodCount.textContent =
            `${adminFoods.length} items`;
    }

    if (!adminFoodsContainer) {
        return;
    }

    if (adminFoods.length === 0) {
        setPageMessage(
            "No food items found."
        );

        adminFoodsContainer.innerHTML =
            "";

        return;
    }

    if (adminFoodMessage) {
        adminFoodMessage.style.display =
            "none";
    }

    adminFoodsContainer.innerHTML =
        adminFoods
            .map(createAdminFoodCard)
            .join("");
}

/* =========================================
   RESET FOOD FORM
========================================= */

function resetFoodForm() {
    adminFoodForm?.reset();

    if (foodIdInput) {
        foodIdInput.value = "";
    }

    if (foodImageUrlInput) {
        foodImageUrlInput.value = "";
    }

    if (foodImageFileInput) {
        foodImageFileInput.value = "";
    }

    if (foodAvailableInput) {
        foodAvailableInput.checked =
            true;
    }

    currentImagePublicId = "";

    if (previewObjectUrl) {
        URL.revokeObjectURL(
            previewObjectUrl
        );

        previewObjectUrl = null;
    }

    if (foodImagePreview) {
        foodImagePreview.src =
            PLACEHOLDER_IMAGE;
    }

    setImageMessage("");

    if (foodFormTitle) {
        foodFormTitle.textContent =
            "Add New Food";
    }

    if (foodSubmitButton) {
        foodSubmitButton.textContent =
            "Add Food";

        foodSubmitButton.disabled =
            false;
    }

    if (cancelEditButton) {
        cancelEditButton.style.display =
            "none";
    }
}

/* =========================================
   EDIT FOOD
========================================= */

function startFoodEdit(foodId) {
    const selectedFood =
        adminFoods.find(
            function (food) {
                return food._id === foodId;
            }
        );

    if (!selectedFood) {
        alert("Food item not found.");
        return;
    }

    foodIdInput.value =
        selectedFood._id;

    foodNameInput.value =
        selectedFood.name || "";

    foodCategoryInput.value =
        selectedFood.category || "";

    foodPriceInput.value =
        selectedFood.price || "";

    foodDescriptionInput.value =
        selectedFood.description || "";

    foodAvailableInput.checked =
        selectedFood.available !== false;

    foodImageUrlInput.value =
        selectedFood.image || "";

    /*
       Existing Cloudinary public ID preserve chestham.
    */
    currentImagePublicId =
        selectedFood.imagePublicId || "";

    foodImageFileInput.value = "";

    foodImagePreview.src =
        selectedFood.image ||
        PLACEHOLDER_IMAGE;

    setImageMessage(
        selectedFood.image
            ? "Current food image."
            : "No image uploaded."
    );

    foodFormTitle.textContent =
        "Edit Food Item";

    foodSubmitButton.textContent =
        "Update Food";

    cancelEditButton.style.display =
        "inline-block";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/* =========================================
   ADD OR UPDATE FOOD
========================================= */

async function saveFood(event) {
    event.preventDefault();

    const authentication =
        getAdminAuthentication();

    if (!authentication) {
        return;
    }

    const foodId =
        foodIdInput.value.trim();

    const foodName =
        foodNameInput.value.trim();

    const category =
        foodCategoryInput.value.trim();

    const price =
        Number(foodPriceInput.value);

    const description =
        foodDescriptionInput.value.trim();

    if (!foodName) {
        alert(
            "Please enter food name."
        );

        foodNameInput.focus();
        return;
    }

    if (!category) {
        alert(
            "Please select category."
        );

        foodCategoryInput.focus();
        return;
    }

    if (
        !Number.isFinite(price) ||
        price <= 0
    ) {
        alert(
            "Please enter a valid price."
        );

        foodPriceInput.focus();
        return;
    }

    const isEditing =
        Boolean(foodId);

    foodSubmitButton.disabled =
        true;

    foodSubmitButton.textContent =
        isEditing
            ? "Updating..."
            : "Adding...";

    try {
        let imageUrl =
            foodImageUrlInput.value.trim();

        let imagePublicId =
            currentImagePublicId;

        const selectedImageFile =
            foodImageFileInput
                .files?.[0];

        if (selectedImageFile) {
            if (
                !validateImageFile(
                    selectedImageFile
                )
            ) {
                return;
            }

            setImageMessage(
                "Uploading image to Cloudinary...",
                "warning"
            );

            const uploadResult =
                await uploadImageToServer(
                    selectedImageFile,
                    authentication.token
                );

            imageUrl =
                uploadResult.imageUrl;

            imagePublicId =
                uploadResult.imagePublicId;

            currentImagePublicId =
                imagePublicId;

            foodImageUrlInput.value =
                imageUrl;

            foodImagePreview.src =
                imageUrl;

            setImageMessage(
                "Image uploaded successfully.",
                "success"
            );
        }

        const foodData = {
            name: foodName,
            category,
            price,
            description,
            image: imageUrl,
            imagePublicId,
            available:
                foodAvailableInput.checked
        };

        const requestUrl =
            isEditing
                ? `${FOOD_API}/${foodId}`
                : FOOD_API;

        const requestMethod =
            isEditing
                ? "PATCH"
                : "POST";

        const response =
            await fetch(
                requestUrl,
                {
                    method:
                        requestMethod,

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${authentication.token}`
                    },

                    body:
                        JSON.stringify(
                            foodData
                        )
                }
            );

        const data =
            await readResponseData(
                response
            );

        if (
            handleUnauthorizedResponse(
                response,
                data
            )
        ) {
            return;
        }

        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                "Unable to save food item."
            );
        }

        alert(
            data.message ||
            (
                isEditing
                    ? "Food updated successfully."
                    : "Food added successfully."
            )
        );

        resetFoodForm();

        await loadAdminFoods();

    } catch (error) {
        console.error(
            "Save food error:",
            error
        );

        setImageMessage(
            error.message ||
            "Unable to save food item.",
            "error"
        );

        alert(
            error.message ||
            "Unable to save food item."
        );

    } finally {
        foodSubmitButton.disabled =
            false;

        foodSubmitButton.textContent =
            foodIdInput.value
                ? "Update Food"
                : "Add Food";
    }
}

/* =========================================
   TOGGLE AVAILABILITY
========================================= */

async function toggleFoodAvailability(
    foodId,
    currentAvailability
) {
    const authentication =
        getAdminAuthentication();

    if (!authentication) {
        return;
    }

    try {
        const response =
            await fetch(
                `${FOOD_API}/${foodId}`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${authentication.token}`
                    },

                    body:
                        JSON.stringify({
                            available:
                                !currentAvailability
                        })
                }
            );

        const data =
            await readResponseData(
                response
            );

        if (
            handleUnauthorizedResponse(
                response,
                data
            )
        ) {
            return;
        }

        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                "Unable to update availability."
            );
        }

        alert(
            "Food availability updated."
        );

        await loadAdminFoods();

    } catch (error) {
        console.error(
            "Availability error:",
            error
        );

        alert(
            error.message ||
            "Unable to update availability."
        );
    }
}

/* =========================================
   DELETE FOOD
========================================= */

async function deleteFood(foodId) {
    const authentication =
        getAdminAuthentication();

    if (!authentication) {
        return;
    }

    const confirmed =
        window.confirm(
            "Are you sure you want to delete this food item?"
        );

    if (!confirmed) {
        return;
    }

    try {
        const response =
            await fetch(
                `${FOOD_API}/${foodId}`,
                {
                    method: "DELETE",

                    headers: {
                        Authorization:
                            `Bearer ${authentication.token}`
                    }
                }
            );

        const data =
            await readResponseData(
                response
            );

        if (
            handleUnauthorizedResponse(
                response,
                data
            )
        ) {
            return;
        }

        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                "Unable to delete food item."
            );
        }

        alert(
            data.message ||
            "Food item deleted successfully."
        );

        resetFoodForm();

        await loadAdminFoods();

    } catch (error) {
        console.error(
            "Delete food error:",
            error
        );

        alert(
            error.message ||
            "Unable to delete food item."
        );
    }
}

/* =========================================
   EVENT LISTENERS
========================================= */

adminFoodForm?.addEventListener(
    "submit",
    saveFood
);

foodImageFileInput?.addEventListener(
    "change",
    showSelectedImagePreview
);

cancelEditButton?.addEventListener(
    "click",
    resetFoodForm
);

adminFoodsContainer?.addEventListener(
    "click",
    function (event) {
        const button =
            event.target.closest(
                "button[data-action]"
            );

        if (!button) {
            return;
        }

        const foodId =
            button.dataset.id;

        const action =
            button.dataset.action;

        if (action === "edit") {
            startFoodEdit(foodId);
            return;
        }

        if (
            action === "availability"
        ) {
            const currentAvailability =
                button.dataset.available ===
                "true";

            toggleFoodAvailability(
                foodId,
                currentAvailability
            );

            return;
        }

        if (action === "delete") {
            deleteFood(foodId);
        }
    }
);

/* =========================================
   PAGE START
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {
        const authentication =
            getAdminAuthentication();

        if (!authentication) {
            return;
        }

        resetFoodForm();

        loadAdminFoods();
    }
);