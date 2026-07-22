const FOOD_API_URL = "http://localhost:5000/api/foods";

let homeFoods = [];

/* =====================================================
   HELPERS
===================================================== */

function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem("user")) || null;
    } catch (error) {
        return null;
    }
}

function getStoredCart() {
    try {
        const cart = JSON.parse(localStorage.getItem("cart"));
        return Array.isArray(cart) ? cart : [];
    } catch (error) {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
}

function escapeHTML(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getFoodImage(image) {
    if (!image) {
        return "images/food-placeholder.jpg";
    }

    if (
        image.startsWith("http://") ||
        image.startsWith("https://") ||
        image.startsWith("data:") ||
        image.startsWith("blob:")
    ) {
        return image;
    }

    if (image.startsWith("/uploads")) {
        return `http://localhost:5000${image}`;
    }

    return image;
}

/* =====================================================
   CART
===================================================== */

function updateCartCount() {
    const cartCount = document.getElementById("cartCount");

    if (!cartCount) {
        return;
    }

    const cart = getStoredCart();

    const totalQuantity = cart.reduce((total, item) => {
        return total + Number(item.quantity || 1);
    }, 0);

    cartCount.textContent = totalQuantity;
}

function addFoodToCart(foodId) {
    const food = homeFoods.find(
        (item) => String(item._id) === String(foodId)
    );

    if (!food) {
        alert("Food item not found.");
        return;
    }

    if (food.available === false) {
        alert("This food item is currently unavailable.");
        return;
    }

    const cart = getStoredCart();

    const existingItem = cart.find(
        (item) => String(item._id || item.foodId || item.id) === String(food._id)
    );

    if (existingItem) {
        existingItem.quantity = Number(existingItem.quantity || 1) + 1;
    } else {
        cart.push({
            _id: food._id,
            id: food._id,
            foodId: food._id,
            name: food.name,
            category: food.category,
            description: food.description,
            price: Number(food.price),
            image: food.image,
            available: food.available,
            quantity: 1
        });
    }

    saveCart(cart);

    alert(`${food.name} added to cart.`);
}

window.addFoodToCart = addFoodToCart;

/* =====================================================
   FOOD CARD RENDERING
===================================================== */

function createFoodCard(food) {
    const available = food.available !== false;

    const availabilityText = available
        ? "Available"
        : "Unavailable";

    const availabilityClass = available
        ? "food-available"
        : "food-unavailable";

    const buttonText = available
        ? "Add to Cart"
        : "Unavailable";

    return `
        <article class="food-card">

            <img
                src="${escapeHTML(getFoodImage(food.image))}"
                alt="${escapeHTML(food.name)}"
                class="food-card-image"
                onerror="this.src='images/food-placeholder.jpg'"
            >

            <div class="food-details">

                <div class="food-card-top-row">

                    <span class="food-category">
                        ${escapeHTML(food.category || "Homemade")}
                    </span>

                    <span class="food-status ${availabilityClass}">
                        ${availabilityText}
                    </span>

                </div>

                <h3>
                    ${escapeHTML(food.name || "Food Item")}
                </h3>

                <p>
                    ${escapeHTML(
                        food.description ||
                        "Fresh homemade food prepared with care."
                    )}
                </p>

                <div class="food-card-footer">

                    <strong class="food-price">
                        ₹${Number(food.price || 0).toFixed(0)}
                    </strong>

                    <button
                        type="button"
                        class="add-to-cart-btn"
                        data-food-id="${escapeHTML(food._id)}"
                        ${available ? "" : "disabled"}
                    >
                        ${buttonText}
                    </button>

                </div>

            </div>

        </article>
    `;
}

function renderFoods(foods) {
    const foodContainer = document.getElementById("foodContainer");
    const loadingMessage = document.getElementById("foodLoadingMessage");

    if (!foodContainer) {
        return;
    }

    if (loadingMessage) {
        loadingMessage.style.display = "none";
    }

    if (!Array.isArray(foods) || foods.length === 0) {
        foodContainer.innerHTML = `
            <div class="home-empty-foods">
                <h3>No food items found</h3>
                <p>Please add food items from the Admin Food Management page.</p>
            </div>
        `;

        return;
    }

    foodContainer.innerHTML = foods
        .slice(0, 6)
        .map(createFoodCard)
        .join("");
}

/* =====================================================
   LOAD FOOD ITEMS
===================================================== */

async function loadHomeFoods() {
    const loadingMessage = document.getElementById("foodLoadingMessage");

    try {
        if (loadingMessage) {
            loadingMessage.style.display = "block";
            loadingMessage.textContent = "Loading food items...";
        }

        const response = await fetch(FOOD_API_URL);

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load food items.");
        }

        homeFoods = Array.isArray(data.foods)
            ? data.foods
            : Array.isArray(data)
                ? data
                : [];

        renderFoods(homeFoods);
    } catch (error) {
        console.error("Home food loading error:", error);

        if (loadingMessage) {
            loadingMessage.style.display = "block";
            loadingMessage.textContent =
                "Unable to load food items. Check whether the backend is running.";
        }
    }
}

/* =====================================================
   SEARCH
===================================================== */

function searchHomeFoods() {
    const searchInput = document.getElementById("homeSearch");

    if (!searchInput) {
        return;
    }

    const searchValue = searchInput.value
        .trim()
        .toLowerCase();

    if (!searchValue) {
        renderFoods(homeFoods);
        return;
    }

    const filteredFoods = homeFoods.filter((food) => {
        const searchableText = `
            ${food.name || ""}
            ${food.category || ""}
            ${food.description || ""}
        `.toLowerCase();

        return searchableText.includes(searchValue);
    });

    renderFoods(filteredFoods);

    document
        .getElementById("popularFoods")
        ?.scrollIntoView({
            behavior: "smooth"
        });
}

/* =====================================================
   CATEGORY FILTER
===================================================== */

function filterFoodsByCategory(category) {
    if (!category || category.toLowerCase() === "all") {
        renderFoods(homeFoods);
        return;
    }

    const filteredFoods = homeFoods.filter((food) => {
        return String(food.category || "").toLowerCase() ===
            String(category).toLowerCase();
    });

    renderFoods(filteredFoods);

    document
        .getElementById("popularFoods")
        ?.scrollIntoView({
            behavior: "smooth"
        });
}

/* =====================================================
   NAVBAR AUTH
===================================================== */

function renderAuthenticationNavigation() {
    const authNav = document.getElementById("authNav");
    const user = getStoredUser();

    if (!authNav) {
        return;
    }

    if (!user) {
        authNav.innerHTML = `
            <a href="login.html">
                Login
            </a>
        `;

        return;
    }

    const displayName =
        user.name ||
        user.fullName ||
        user.email ||
        "User";

    authNav.innerHTML = `
        <div class="home-user-navigation">

            <a href="profile.html" class="home-user-name">
                Hi, ${escapeHTML(displayName)}
            </a>

            <button
                type="button"
                id="homeLogoutButton"
                class="home-logout-button"
            >
                Logout
            </button>

        </div>
    `;

    const logoutButton =
        document.getElementById("homeLogoutButton");

    logoutButton?.addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "index.html";
    });
}

/* =====================================================
   MOBILE NAVIGATION
===================================================== */

function setupMobileNavigation() {
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");

    if (!menuToggle || !navLinks) {
        return;
    }

    menuToggle.addEventListener("click", () => {
        navLinks.classList.toggle("show");
    });
}

/* =====================================================
   EVENTS
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
    renderAuthenticationNavigation();
    setupMobileNavigation();
    loadHomeFoods();

    const foodContainer =
        document.getElementById("foodContainer");

    foodContainer?.addEventListener("click", (event) => {
        const button = event.target.closest(
            ".add-to-cart-btn"
        );

        if (!button || button.disabled) {
            return;
        }

        addFoodToCart(button.dataset.foodId);
    });

    const searchButton =
        document.getElementById("homeSearchButton");

    const searchInput =
        document.getElementById("homeSearch");

    searchButton?.addEventListener(
        "click",
        searchHomeFoods
    );

    searchInput?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            searchHomeFoods();
        }
    });

    document
        .querySelectorAll(".category-card")
        .forEach((button) => {
            button.addEventListener("click", () => {
                document
                    .querySelectorAll(".category-card")
                    .forEach((categoryButton) => {
                        categoryButton.classList.remove("active");
                    });

                button.classList.add("active");

                filterFoodsByCategory(
                    button.dataset.category
                );
            });
        });
});