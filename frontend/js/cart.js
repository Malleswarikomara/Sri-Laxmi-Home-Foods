let cart = JSON.parse(localStorage.getItem("cart")) || [];

const container = document.getElementById("cartContainer");

const totalText = document.getElementById("grandTotal");

function displayCart() {

    container.innerHTML = "";

    let total = 0;

    if(cart.length === 0){

        container.innerHTML = `
            <h2 style="text-align:center;margin-top:60px;">
                Your Cart is Empty 😔
            </h2>
        `;

        totalText.innerHTML = "Grand Total : ₹0";

        return;

    }

    cart.forEach((item,index)=>{

        total += item.price * item.quantity;

        container.innerHTML += `

        <div class="cart-card">

            <img src="images/food-placeholder.jpg">

            <div class="cart-info">

                <h2>${item.name}</h2>

                <p>${item.description}</p>

                <h3>₹${item.price}</h3>

                <div class="quantity">

                    <button onclick="decrease(${index})">-</button>

                    <span>${item.quantity}</span>

                    <button onclick="increase(${index})">+</button>

                </div>

                <button class="remove-btn" onclick="removeItem(${index})">
                    Remove
                </button>

            </div>

        </div>

        `;

    });

    totalText.innerHTML = `Grand Total : ₹${total}`;

}

function increase(index){

    cart[index].quantity++;

    saveCart();

}

function decrease(index){

    if(cart[index].quantity>1){

        cart[index].quantity--;

    }

    saveCart();

}

function removeItem(index){

    cart.splice(index,1);

    saveCart();

}

function saveCart(){

    localStorage.setItem("cart",JSON.stringify(cart));

    displayCart();

}

displayCart();

document.getElementById("checkoutBtn").addEventListener("click",()=>{

    window.location.href="checkout.html";

});