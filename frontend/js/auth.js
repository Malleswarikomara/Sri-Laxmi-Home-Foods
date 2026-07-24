const AUTH_API =
    "https://sri-laxmi-home-foods.onrender.com/api/auth";

/* -------------------------------
   HELPER FUNCTIONS
-------------------------------- */

function getInputValue(form, selectors) {
    const input =
        form.querySelector(selectors);

    return input
        ? input.value.trim()
        : "";
}

async function readResponse(response) {
    const responseText =
        await response.text();

    try {
        return JSON.parse(responseText);
    } catch (error) {
        return {
            success: false,
            message:
                responseText ||
                "Server returned an invalid response."
        };
    }
}

function setButtonLoading(
    button,
    loadingText,
    defaultText,
    isLoading
) {
    if (!button) {
        return;
    }

    button.disabled = isLoading;

    button.textContent =
        isLoading
            ? loadingText
            : defaultText;
}

function saveLoginData(data) {
    localStorage.setItem(
        "token",
        data.token
    );

    localStorage.setItem(
        "user",
        JSON.stringify(data.user)
    );
}

function redirectAfterLogin(user) {
    if (user.role === "admin") {
        window.location.href =
            "admin-orders.html";
    } else {
        window.location.href =
            "index.html";
    }
}

/* -------------------------------
   REGISTER
-------------------------------- */

const registerForm =
    document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            const name = getInputValue(
                registerForm,
                "#name, #registerName, [name='name']"
            );

            const email = getInputValue(
                registerForm,
                "#email, #registerEmail, [name='email']"
            ).toLowerCase();

            const phone = getInputValue(
                registerForm,
                "#phone, #registerPhone, [name='phone']"
            );

            const password = getInputValue(
                registerForm,
                "#password, #registerPassword, [name='password']"
            );

            const confirmPassword =
                getInputValue(
                    registerForm,
                    "#confirmPassword, [name='confirmPassword']"
                );

            if (!name) {
                alert("Please enter your name.");
                return;
            }

            if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                    email
                )
            ) {
                alert(
                    "Please enter a valid email address."
                );

                return;
            }

            if (
                phone &&
                !/^[6-9]\d{9}$/.test(phone)
            ) {
                alert(
                    "Please enter a valid 10-digit mobile number."
                );

                return;
            }

            if (password.length < 6) {
                alert(
                    "Password must contain at least 6 characters."
                );

                return;
            }

            if (
                confirmPassword &&
                password !== confirmPassword
            ) {
                alert(
                    "Password and confirm password do not match."
                );

                return;
            }

            const submitButton =
                registerForm.querySelector(
                    'button[type="submit"]'
                );

            setButtonLoading(
                submitButton,
                "Creating Account...",
                "Register",
                true
            );

            try {
                const response = await fetch(
                    `${AUTH_API}/register`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            name,
                            email,
                            phone,
                            password
                        })
                    }
                );

                const data =
                    await readResponse(response);

                if (
                    !response.ok ||
                    !data.success
                ) {
                    throw new Error(
                        data.message ||
                        "Registration failed."
                    );
                }

                alert(
                    data.message ||
                    "Registration successful. Please login."
                );

                registerForm.reset();

                window.location.href =
                    "login.html";

            } catch (error) {
                console.error(
                    "Registration error:",
                    error
                );

                alert(error.message);

            } finally {
                setButtonLoading(
                    submitButton,
                    "Creating Account...",
                    "Register",
                    false
                );
            }
        }
    );
}

/* -------------------------------
   LOGIN
-------------------------------- */

const loginForm =
    document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            const email = getInputValue(
                loginForm,
                "#email, #loginEmail, [name='email']"
            ).toLowerCase();

            const password = getInputValue(
                loginForm,
                "#password, #loginPassword, [name='password']"
            );

            if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                    email
                )
            ) {
                alert(
                    "Please enter a valid email address."
                );

                return;
            }

            if (!password) {
                alert(
                    "Please enter your password."
                );

                return;
            }

            const submitButton =
                loginForm.querySelector(
                    'button[type="submit"]'
                );

            setButtonLoading(
                submitButton,
                "Logging In...",
                "Login",
                true
            );

            try {
                const response = await fetch(
                    `${AUTH_API}/login`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            email,
                            password
                        })
                    }
                );

                const data =
                    await readResponse(response);

                if (
                    !response.ok ||
                    !data.success
                ) {
                    throw new Error(
                        data.message ||
                        "Invalid email or password."
                    );
                }

                if (
                    !data.token ||
                    !data.user
                ) {
                    throw new Error(
                        "Login response is incomplete."
                    );
                }

                saveLoginData(data);

                alert("Login successful!");

                redirectAfterLogin(data.user);

            } catch (error) {
                console.error(
                    "Login error:",
                    error
                );

                alert(error.message);

            } finally {
                setButtonLoading(
                    submitButton,
                    "Logging In...",
                    "Login",
                    false
                );
            }
        }
    );
}

/* -------------------------------
   LOGOUT
-------------------------------- */

function logoutUser() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("lastOrder");

    alert("Logged out successfully.");

    window.location.href =
        "login.html";
}

window.logoutUser = logoutUser;