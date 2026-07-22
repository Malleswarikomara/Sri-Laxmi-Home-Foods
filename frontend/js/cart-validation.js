const CART_FOOD_API =
    "http://localhost:5000/api/foods";

function getStoredCart() {
    try {
        return JSON.parse(
            localStorage.getItem("cart") || "[]"
        );
    } catch (error) {
        return [];
    }
}

function saveStoredCart(cart) {
    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );
}

function createCartWarningBox() {
    let warningBox =
        document.getElementById("cartAvailabilityWarning");

    if (warningBox) {
        return warningBox;
    }

    warningBox =
        document.createElement("div");

    warningBox.id =
        "cartAvailabilityWarning";

    warningBox.className =
        "cart-availability-warning";

    const cartMain =
        document.querySelector("main") ||
        document.body;

    cartMain.prepend(warningBox);

    return warningBox;
}

function findCheckoutButtons() {
    return document.querySelectorAll(
        `
        #checkoutButton,
        .checkout-button,
        a[href="checkout.html"],
        button[data-checkout]
        `
    );
}

function setCheckoutDisabled(disabled) {
    const checkoutButtons =
        findCheckoutButtons();

    checkoutButtons.forEach((button) => {
        if (disabled) {
            button.dataset.originalHref =
                button.getAttribute("href") || "";

            button.removeAttribute("href");

            button.disabled = true;

            button.classList.add(
                "checkout-disabled"
            );
        } else {
            const originalHref =
                button.dataset.originalHref;

            if (originalHref) {
                button.setAttribute(
                    "href",
                    originalHref
                );
            }

            button.disabled = false;

            button.classList.remove(
                "checkout-disabled"
            );
        }
    });
}

function removeInvalidCartItems(validFoodIds) {
    const cart =
        getStoredCart();

    const cleanedCart =
        cart.filter((item) =>
            validFoodIds.includes(
                String(item._id)
            )
        );

    saveStoredCart(cleanedCart);

    window.location.reload();
}

async function validateCartItems() {
    const cart =
        getStoredCart();

    if (cart.length === 0) {
        return;
    }

    try {
        const response =
            await fetch(CART_FOOD_API);

        const data =
            await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Unable to check cart items."
            );
        }

        const foods =
            data.foods || [];

        const foodMap =
            new Map(
                foods.map((food) => [
                    String(food._id),
                    food
                ])
            );

        const invalidItems = [];

        const availableFoodIds = [];

        cart.forEach((cartItem) => {
            const food =
                foodMap.get(
                    String(cartItem._id)
                );

            if (!food) {
                invalidItems.push({
                    name:
                        cartItem.name ||
                        "Food item",
                    reason:
                        "This item was deleted."
                });

                return;
            }

            if (!food.available) {
                invalidItems.push({
                    name: food.name,
                    reason:
                        "Currently unavailable."
                });

                return;
            }

            availableFoodIds.push(
                String(food._id)
            );
        });

        if (invalidItems.length === 0) {
            setCheckoutDisabled(false);
            return;
        }

        setCheckoutDisabled(true);

        const warningBox =
            createCartWarningBox();

        warningBox.innerHTML = `
            <h3>⚠ Some cart items are unavailable</h3>

            <ul>
                ${invalidItems
                    .map(
                        (item) => `
                            <li>
                                <strong>${item.name}</strong>
                                — ${item.reason}
                            </li>
                        `
                    )
                    .join("")}
            </ul>

            <p>
                Remove unavailable items before checkout.
            </p>

            <button
                type="button"
                id="removeInvalidCartItems"
            >
                Remove Unavailable Items
            </button>
        `;

        document
            .getElementById(
                "removeInvalidCartItems"
            )
            .addEventListener(
                "click",
                () => {
                    removeInvalidCartItems(
                        availableFoodIds
                    );
                }
            );

    } catch (error) {
        console.error(
            "Cart validation error:",
            error
        );
    }
}

document.addEventListener(
    "DOMContentLoaded",
    validateCartItems
);