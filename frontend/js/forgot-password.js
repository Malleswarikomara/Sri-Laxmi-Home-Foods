const FORGOT_PASSWORD_API =
    "https://sri-laxmi-home-foods.onrender.com/api/auth/forgot-password";

document.addEventListener(
    "DOMContentLoaded",
    function () {
        const form =
            document.getElementById(
                "forgotPasswordForm"
            );

        const emailInput =
            document.getElementById(
                "forgotEmail"
            );

        const submitButton =
            document.getElementById(
                "forgotPasswordButton"
            );

        const messageElement =
            document.getElementById(
                "forgotPasswordMessage"
            );

        if (
            !form ||
            !emailInput ||
            !submitButton ||
            !messageElement
        ) {
            return;
        }

        form.addEventListener(
            "submit",
            async function (event) {
                event.preventDefault();

                messageElement.textContent = "";

                const email =
                    emailInput.value
                        .trim()
                        .toLowerCase();

                const emailPattern =
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (!emailPattern.test(email)) {
                    showMessage(
                        "Please enter a valid email address.",
                        false
                    );

                    return;
                }

                try {
                    submitButton.disabled = true;

                    submitButton.textContent =
                        "Sending Reset Link...";

                    const response =
                        await fetch(
                            FORGOT_PASSWORD_API,
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body: JSON.stringify({
                                    email
                                })
                            }
                        );

                    const data =
                        await response.json();

                    if (
                        !response.ok ||
                        !data.success
                    ) {
                        throw new Error(
                            data.message ||
                            "Unable to send reset link."
                        );
                    }

                    showMessage(
                        data.message ||
                        "Password reset link has been sent.",
                        true
                    );

                    form.reset();

                } catch (error) {
                    console.error(
                        "Forgot password error:",
                        error
                    );

                    showMessage(
                        error.message ||
                        "Unable to send reset link. Please try again.",
                        false
                    );

                } finally {
                    submitButton.disabled = false;

                    submitButton.textContent =
                        "Send Reset Link";
                }
            }
        );

        function showMessage(
            message,
            success
        ) {
            messageElement.textContent =
                message;

            messageElement.style.color =
                success
                    ? "green"
                    : "red";
        }
    }
);