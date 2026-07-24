const MENU_API =
    "https://sri-laxmi-home-foods.onrender.com/api/foods";

const menuContainer =
    document.getElementById("menuContainer");

const menuMessage =
    document.getElementById("menuMessage");

const menuSearch =
    document.getElementById("menuSearch");

const menuCategory =
    document.getElementById("menuCategory");

let menuFoods = [];

function getCart() {
    return JSON.parse(
        localStorage.getItem("cart") || "[]"
    );
}

function saveCart(cart) {
    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    updateCartCount();
}

function updateCartCount() {
    const cartCount =
        document.getElementById("cartCount");

    if (!cartCount) {
        return;
    }

    const cart = getCart();

    const totalQuantity = cart.reduce(
        (total, item) => {
            return total + Number(item.quantity || 0);
        },
        0
    );

    cartCount.textContent = totalQuantity;
}

function addMenuFoodToCart(foodId) {
    const food = menuFoods.find(
        (item) => item._id === foodId
    );

    if (!food) {
        alert("Food item not found.");
        return;
    }

    if (!food.available) {
        alert("This food is currently unavailable.");
        return;
    }

    const cart = getCart();

    const existingItem = cart.find(
        (item) => item._id === foodId
    );

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            _id: food._id,
            name: food.name,
            price: Number(food.price),
            image:
                food.image ||
                "images/food-placeholder.jpg",
            quantity: 1
        });
    }

    saveCart(cart);

    alert(`${food.name} added to cart.`);
}

function createMenuCard(food) {
    const image =
        food.image ||
        "images/food-placeholder.jpg";

    const availabilityText =
        food.available
            ? "Available"
            : "Unavailable";

    const buttonText =
        food.available
            ? "Add to Cart"
            : "Unavailable";

    const disabled =
        food.available ? "" : "disabled";

    return `
        <article class="menu-food-card">

            <img
                src="${image}"
                alt="${food.name}"
                onerror="this.src='images/food-placeholder.jpg'"
            >

            <div class="menu-food-content">

                <div class="menu-food-top">

                    <span>
                        ${food.category}
                    </span>

                    <strong>
                        ${availabilityText}
                    </strong>

                </div>

                <h2>
                    ${food.name}
                </h2>

                <p>
                    ${
                        food.description ||
                        "Fresh homemade food prepared with quality ingredients."
                    }
                </p>

                <div class="menu-food-footer">

                    <strong class="menu-price">
                        ₹${food.price}
                    </strong>

                    <button
                        type="button"
                        onclick="addMenuFoodToCart('${food._id}')"
                        ${disabled}
                    >
                        ${buttonText}
                    </button>

                </div>

            </div>

        </article>
    `;
}

function renderMenuFoods(foods) {
    if (foods.length === 0) {
        menuMessage.style.display = "block";

        menuMessage.textContent =
            "No food items found.";

        menuContainer.innerHTML = "";
        return;
    }

    menuMessage.style.display = "none";

    menuContainer.innerHTML =
        foods.map(createMenuCard).join("");
}

function filterMenuFoods() {
    const searchValue =
        menuSearch.value
            .trim()
            .toLowerCase();

    const selectedCategory =
        menuCategory.value;

    const filteredFoods = menuFoods.filter(
        (food) => {
            const name =
                String(food.name || "")
                    .toLowerCase();

            const description =
                String(food.description || "")
                    .toLowerCase();

            const matchesSearch =
                name.includes(searchValue) ||
                description.includes(searchValue);

            const matchesCategory =
                selectedCategory === "All" ||
                food.category === selectedCategory;

            return matchesSearch && matchesCategory;
        }
    );

    renderMenuFoods(filteredFoods);
}

async function loadMenuFoods() {
    try {
        const response =
            await fetch(MENU_API);

        const data =
            await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Unable to load menu."
            );
        }

        menuFoods = data.foods || [];

        renderMenuFoods(menuFoods);

    } catch (error) {
        console.error(error);

        menuMessage.style.display = "block";

        menuMessage.textContent =
            `Unable to load menu: ${error.message}`;
    }
}

menuSearch.addEventListener(
    "input",
    filterMenuFoods
);

menuCategory.addEventListener(
    "change",
    filterMenuFoods
);

document.addEventListener(
    "DOMContentLoaded",
    () => {
        updateCartCount();
        loadMenuFoods();
    }
);