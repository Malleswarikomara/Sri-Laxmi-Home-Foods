document.addEventListener("DOMContentLoaded", function () {
    const oldButton =
        document.getElementById("menuToggle");

    const navLinks =
        document.getElementById("navLinks");

    if (!oldButton || !navLinks) {
        console.log("Navbar elements not found");
        return;
    }

    const menuButton =
        oldButton.cloneNode(true);

    oldButton.replaceWith(menuButton);

    menuButton.addEventListener(
        "click",
        function () {
            navLinks.classList.toggle("show");

            if (
                navLinks.classList.contains("show")
            ) {
                menuButton.textContent = "✕";
            } else {
                menuButton.textContent = "☰";
            }
        }
    );
});