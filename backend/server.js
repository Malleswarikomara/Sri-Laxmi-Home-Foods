const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const foodRoutes = require("./routes/foodRoutes");
const orderRoutes = require("./routes/orderRoutes");
const contactRoutes = require("./routes/contactRoutes");

/* =========================================
   ENVIRONMENT CONFIGURATION
========================================= */

dotenv.config();

/* =========================================
   DATABASE CONNECTION
========================================= */

connectDB();

/* =========================================
   EXPRESS APPLICATION
========================================= */

const app = express();

/*
   Express technology information ni
   response headers lo hide chestundi.
*/
app.disable("x-powered-by");

/* =========================================
   CORS CONFIGURATION
========================================= */

const productionFrontendURL = String(
    process.env.FRONTEND_URL ||
    "https://preeminent-medovik-d0ca90.netlify.app"
)
    .trim()
    .replace(/\/+$/, "");

const allowedOrigins = new Set([
    productionFrontendURL,

    /*
       Local Live Server URLs
    */
    "http://127.0.0.1:5500",
    "http://localhost:5500"
]);

const corsOptions = {
    origin(origin, callback) {
        /*
           Postman, mobile applications and
           server-to-server requests sometimes
           Origin header pampinchavu.
        */
        if (!origin) {
            return callback(
                null,
                true
            );
        }

        const cleanOrigin =
            String(origin)
                .trim()
                .replace(/\/+$/, "");

        if (
            allowedOrigins.has(
                cleanOrigin
            )
        ) {
            return callback(
                null,
                true
            );
        }

        const corsError =
            new Error(
                "This website is not allowed to access the API."
            );

        corsError.code =
            "CORS_NOT_ALLOWED";

        return callback(
            corsError
        );
    },

    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ],

    allowedHeaders: [
        "Content-Type",
        "Authorization"
    ],

    credentials: false,

    optionsSuccessStatus: 204
};

app.use(
    cors(corsOptions)
);

/* =========================================
   REQUEST BODY MIDDLEWARE
========================================= */

app.use(
    express.json({
        limit: "1mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "1mb"
    })
);

/* =========================================
   STATIC FILES
========================================= */

/*
   Old/local uploaded food images kosam.
   Cloudinary images direct URLs tho load avutayi.
*/
app.use(
    "/uploads",
    express.static(
        path.join(
            __dirname,
            "uploads"
        )
    )
);

/* =========================================
   HEALTH CHECK ROUTE
========================================= */

app.get("/", (req, res) => {
    return res.status(200).json({
        success: true,
        message:
            "Sri Laxmi Home Foods API is running",

        environment:
            process.env.NODE_ENV ||
            "development"
    });
});

/* =========================================
   API ROUTES
========================================= */

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/foods",
    foodRoutes
);

app.use(
    "/api/orders",
    orderRoutes
);

app.use(
    "/api/contact",
    contactRoutes
);

/* =========================================
   INVALID ROUTE
========================================= */

app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message:
            "API route not found"
    });
});

/* =========================================
   GLOBAL ERROR HANDLER
========================================= */

app.use(
    (
        error,
        req,
        res,
        next
    ) => {
        if (
            error.code ===
            "CORS_NOT_ALLOWED"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "This website is not allowed to access the API."
            });
        }

        console.error(
            "Server error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Internal server error."
        });
    }
);

/* =========================================
   START SERVER
========================================= */

const PORT =
    process.env.PORT ||
    5000;

app.listen(
    PORT,
    () => {
        console.log(
            `Server is running on port ${PORT}`
        );
    }
);