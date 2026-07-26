const AUTH_API =
    "https://sri-laxmi-home-foods.onrender.com/api/auth";

document.addEventListener(
    "DOMContentLoaded",
    function () {
        const form =
            document.getElementById(
                "resetPasswordForm"
            );

        const passwordInput =
            document.getElementById(
                "newPassword"
            );

        const confirmPasswordInput =
            document.getElementById(
                "confirmNewPassword"
            );

        const submitButton =
            document.getElementById(
                "resetPasswordButton"
            );

        const messageElement =
            document.getElementById(
                "resetPasswordMessage"
            );

        const urlParameters =
            new URLSearchParams(
                window.location.search
            );

        const resetToken =
            urlParameters.get("token");

        function showMessage(
            message,
            success = false
        ) {
            if (!messageElement) {
                return;
            }

            messageElement.textContent =
                message;

            messageElement.style.color =
                success
                    ? "green"
                    : "red";
        }

        if (!form) {
            console.error(
                "Reset password form not found."
            );

            return;
        }

        if (!resetToken) {
            showMessage(
                "Reset token is missing. Please request a new password reset link."
            );

            if (submitButton) {
                submitButton.disabled = true;
            }

            return;
        }

        form.addEventListener(
            "submit",
            async function (event) {
                event.preventDefault();

                const password =
                    passwordInput
                        ? String(
                            passwordInput.value
                        )
                        : "";

                const confirmPassword =
                    confirmPasswordInput
                        ? String(
                            confirmPasswordInput.value
                        )
                        : "";

                if (password.length < 8) {
                    showMessage(
                        "Password must contain at least 8 characters."
                    );

                    return;
                }

                if (
                    password !==
                    confirmPassword
                ) {
                    showMessage(
                        "Password and confirm password do not match."
                    );

                    return;
                }

                if (submitButton) {
                    submitButton.disabled = true;

                    submitButton.textContent =
                        "Resetting Password...";
                }

                showMessage("");

                try {
                    const response =
                        await fetch(
                            `${AUTH_API}/reset-password/${encodeURIComponent(resetToken)}`,
                            {
                                method: "PATCH",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({
                                        password,
                                        confirmPassword
                                    })
                            }
                        );

                    const responseText =
                        await response.text();

                    let data = {};

                    try {
                        data = responseText
                            ? JSON.parse(
                                responseText
                            )
                            : {};
                    } catch (error) {
                        data = {
                            success: false,
                            message:
                                responseText ||
                                "Invalid server response."
                        };
                    }

                    if (
                        !response.ok ||
                        !data.success
                    ) {
                        throw new Error(
                            data.message ||
                            "Unable to reset password."
                        );
                    }

                    showMessage(
                        data.message ||
                        "Password reset successful.",
                        true
                    );

                    form.reset();

                    localStorage.removeItem(
                        "token"
                    );

                    localStorage.removeItem(
                        "user"
                    );

                    setTimeout(
                        function () {
                            window.location.replace(
                                "login.html"
                            );
                        },
                        2000
                    );

                } catch (error) {
                    console.error(
                        "Reset password error:",
                        error
                    );

                    showMessage(
                        error.message ||
                        "Unable to reset password. Please request a new reset link."
                    );

                } finally {
                    if (submitButton) {
                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            "Reset Password";
                    }
                }
            }
        );
    }
);