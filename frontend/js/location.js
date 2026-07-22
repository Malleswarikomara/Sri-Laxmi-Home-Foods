window.customerLocation = {
    latitude: null,
    longitude: null
};

document.addEventListener(
    "DOMContentLoaded",
    function () {
        const locationBtn =
            document.getElementById(
                "locationBtn"
            );

        const locationStatus =
            document.getElementById(
                "locationStatus"
            );

        if (!locationBtn) {
            return;
        }

        locationBtn.addEventListener(
            "click",
            function () {
                captureCustomerLocation(
                    locationBtn,
                    locationStatus
                );
            }
        );
    }
);

function captureCustomerLocation(
    locationBtn,
    locationStatus
) {
    if (!navigator.geolocation) {
        updateLocationStatus(
            locationStatus,
            "Your browser does not support location access.",
            false
        );

        return;
    }

    locationBtn.disabled = true;
    locationBtn.textContent =
        "Getting location...";

    updateLocationStatus(
        locationStatus,
        "Please allow location permission in your browser.",
        true
    );

    navigator.geolocation.getCurrentPosition(
        function (position) {
            window.customerLocation = {
                latitude:
                    position.coords.latitude,

                longitude:
                    position.coords.longitude
            };

            locationBtn.textContent =
                "✅ Location Captured";

            updateLocationStatus(
                locationStatus,
                "Current location captured successfully.",
                true
            );
        },

        function (error) {
            console.error(
                "Location error:",
                error
            );

            window.customerLocation = {
                latitude: null,
                longitude: null
            };

            locationBtn.disabled = false;
            locationBtn.textContent =
                "📍 Get Current Location";

            let message =
                "Unable to access your location.";

            if (
                error.code ===
                error.PERMISSION_DENIED
            ) {
                message =
                    "Location permission was denied. You can still enter the address manually.";
            }

            if (
                error.code ===
                error.POSITION_UNAVAILABLE
            ) {
                message =
                    "Your current location is unavailable. Please enter the address manually.";
            }

            if (
                error.code ===
                error.TIMEOUT
            ) {
                message =
                    "Location request timed out. Please try again.";
            }

            updateLocationStatus(
                locationStatus,
                message,
                false
            );
        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000
        }
    );
}

function updateLocationStatus(
    element,
    message,
    success
) {
    if (!element) {
        return;
    }

    element.textContent = message;

    element.className =
        success
            ? "location-status location-success"
            : "location-status location-error";
}