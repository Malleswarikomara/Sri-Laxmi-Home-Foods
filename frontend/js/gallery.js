const GALLERY_API_URL =
    "https://sri-laxmi-home-foods.onrender.com/api/foods";

let galleryFoods = [];
let selectedGalleryCategory = "All";

/* Helpers */

function escapeGalleryHTML(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getGalleryImage(image) {
    if (!image) {
        return "images/food-placeholder.jpg";
    }

    let imagePath = String(image)
        .trim()
        .replaceAll("\\", "/");

    // Already complete URL
    if (
        imagePath.startsWith("http://") ||
        imagePath.startsWith("https://") ||
        imagePath.startsWith("data:") ||
        imagePath.startsWith("blob:")
    ) {
        return imagePath;
    }

    // Frontend local image
    if (imagePath.startsWith("images/")) {
        return imagePath;
    }

    // /uploads/foods/image.png
    if (imagePath.startsWith("/uploads/")) {
        return `https://sri-laxmi-home-foods.onrender.com${imagePath}`;
    }

    // uploads/foods/image.png
    if (imagePath.startsWith("uploads/")) {
        return `https://sri-laxmi-home-foods.onrender.com/${imagePath}`;
    }

    // foods/image.png
    if (imagePath.startsWith("foods/")) {
        return `https://sri-laxmi-home-foods.onrender.com/uploads/${imagePath}`;
    }

    // Only filename: image.png
    return `https://sri-laxmi-home-foods.onrender.com/uploads/foods/${imagePath}`;
}
/* Load foods */

async function loadGalleryFoods() {
    const message =
        document.getElementById("galleryMessage");

    try {
        message.style.display = "block";
        message.textContent =
            "Loading food gallery...";

        const response =
            await fetch(GALLERY_API_URL);

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Unable to load gallery."
            );
        }

        galleryFoods = Array.isArray(data.foods)
            ? data.foods
            : Array.isArray(data)
                ? data
                : [];

        renderGalleryFoods(galleryFoods);
    } catch (error) {
        console.error(
            "Gallery loading error:",
            error
        );

        message.style.display = "block";
        message.textContent =
            "Unable to load food images. Check whether the backend is running.";
    }
}

/* Render cards */

function createGalleryCard(food) {
    return `
        <article
            class="gallery-card"
            data-food-id="${escapeGalleryHTML(food._id)}"
            tabindex="0"
        >

            <img
                src="${escapeGalleryHTML(
                    getGalleryImage(food.image)
                )}"
                alt="${escapeGalleryHTML(food.name)}"
                onerror="this.src='images/food-placeholder.jpg'"
            >

            <div class="gallery-card-overlay">

                <div class="gallery-card-details">

                    <span class="gallery-card-category">
                        ${escapeGalleryHTML(
                            food.category || "Homemade"
                        )}
                    </span>

                    <h3>
                        ${escapeGalleryHTML(
                            food.name || "Food Item"
                        )}
                    </h3>

                    <div class="gallery-card-bottom">

                        <strong class="gallery-card-price">
                            ₹${Number(food.price || 0).toFixed(0)}
                        </strong>

                        <span class="gallery-view-text">
                            View Image →
                        </span>

                    </div>

                </div>

            </div>

        </article>
    `;
}

function renderGalleryFoods(foods) {
    const container =
        document.getElementById("galleryContainer");

    const message =
        document.getElementById("galleryMessage");

    message.style.display = "none";

    if (!Array.isArray(foods) || foods.length === 0) {
        container.innerHTML = `
            <div class="gallery-empty">
                <h3>No food images found</h3>
                <p>
                    Add food items and images from the Admin Food
                    Management page.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        foods.map(createGalleryCard).join("");
}

/* Search and filter */

function applyGalleryFilters() {
    const searchInput =
        document.getElementById("gallerySearch");

    const searchValue =
        searchInput.value.trim().toLowerCase();

    const filteredFoods =
        galleryFoods.filter((food) => {
            const categoryMatches =
                selectedGalleryCategory === "All" ||
                String(food.category || "")
                    .toLowerCase() ===
                selectedGalleryCategory.toLowerCase();

            const searchText = `
                ${food.name || ""}
                ${food.category || ""}
                ${food.description || ""}
            `.toLowerCase();

            const searchMatches =
                !searchValue ||
                searchText.includes(searchValue);

            return categoryMatches && searchMatches;
        });

    renderGalleryFoods(filteredFoods);
}

/* Modal */

function openGalleryModal(foodId) {
    const food =
        galleryFoods.find(
            (item) =>
                String(item._id) === String(foodId)
        );

    if (!food) {
        return;
    }

    const modal =
        document.getElementById("galleryModal");

    const modalImage =
    document.getElementById("galleryModalImage");

modalImage.onerror = function () {
    this.onerror = null;
    this.src = "images/food-placeholder.jpg";
};

modalImage.src = getGalleryImage(food.image);

    document.getElementById(
        "galleryModalName"
    ).textContent = food.name || "Food Item";

    document.getElementById(
        "galleryModalCategory"
    ).textContent =
        food.category || "Homemade Food";

    document.getElementById(
        "galleryModalDescription"
    ).textContent =
        food.description ||
        "Fresh homemade food prepared with care.";

    document.getElementById(
        "galleryModalPrice"
    ).textContent =
        `₹${Number(food.price || 0).toFixed(0)}`;

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";
}

function closeGalleryModal() {
    const modal =
        document.getElementById("galleryModal");

    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";
}

/* Navbar */

function setupGalleryNavbar() {
    const menuToggle =
        document.getElementById("menuToggle");

    const navLinks =
        document.getElementById("navLinks");

    const authNav =
        document.getElementById("authNav");

    menuToggle?.addEventListener(
        "click",
        function () {
            navLinks?.classList.toggle("show");
        }
    );

    try {
        const user =
            JSON.parse(
                localStorage.getItem("user")
            );

        if (user && authNav) {
            authNav.innerHTML = `
                <a href="profile.html">
                    Profile
                </a>
            `;
        }
    } catch (error) {
        console.error(
            "Gallery user data error:",
            error
        );
    }
}

/* Cart count */

function updateGalleryCartCount() {
    const cartCount =
        document.getElementById("cartCount");

    if (!cartCount) {
        return;
    }

    try {
        const cart =
            JSON.parse(
                localStorage.getItem("cart")
            ) || [];

        const totalQuantity =
            cart.reduce(
                (total, item) =>
                    total +
                    Number(item.quantity || 1),
                0
            );

        cartCount.textContent = totalQuantity;
    } catch (error) {
        cartCount.textContent = "0";
    }
}

/* Events */

document.addEventListener(
    "DOMContentLoaded",
    function () {
        setupGalleryNavbar();
        updateGalleryCartCount();
        loadGalleryFoods();

        const searchButton =
            document.getElementById(
                "gallerySearchButton"
            );

        const searchInput =
            document.getElementById(
                "gallerySearch"
            );

        searchButton?.addEventListener(
            "click",
            applyGalleryFilters
        );

        searchInput?.addEventListener(
            "input",
            applyGalleryFilters
        );

        document
            .querySelectorAll(
                ".gallery-filter-button"
            )
            .forEach((button) => {
                button.addEventListener(
                    "click",
                    function () {
                        document
                            .querySelectorAll(
                                ".gallery-filter-button"
                            )
                            .forEach((item) => {
                                item.classList.remove(
                                    "active"
                                );
                            });

                        button.classList.add("active");

                        selectedGalleryCategory =
                            button.dataset.category;

                        applyGalleryFilters();
                    }
                );
            });

        const galleryContainer =
            document.getElementById(
                "galleryContainer"
            );

        galleryContainer?.addEventListener(
            "click",
            function (event) {
                const card =
                    event.target.closest(
                        ".gallery-card"
                    );

                if (!card) {
                    return;
                }

                openGalleryModal(
                    card.dataset.foodId
                );
            }
        );

        galleryContainer?.addEventListener(
            "keydown",
            function (event) {
                if (
                    event.key !== "Enter" &&
                    event.key !== " "
                ) {
                    return;
                }

                const card =
                    event.target.closest(
                        ".gallery-card"
                    );

                if (card) {
                    openGalleryModal(
                        card.dataset.foodId
                    );
                }
            }
        );

        document
            .getElementById(
                "galleryModalClose"
            )
            ?.addEventListener(
                "click",
                closeGalleryModal
            );

        document
            .getElementById("galleryModal")
            ?.addEventListener(
                "click",
                function (event) {
                    if (
                        event.target.id ===
                        "galleryModal"
                    ) {
                        closeGalleryModal();
                    }
                }
            );

        document.addEventListener(
            "keydown",
            function (event) {
                if (event.key === "Escape") {
                    closeGalleryModal();
                }
            }
        );
    }
);