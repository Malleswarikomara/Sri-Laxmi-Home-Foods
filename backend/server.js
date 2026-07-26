const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const helmet = require("helmet");

const {
    rateLimit
} = require("express-rate-limit");

const connectDB = require("./config/db");

const authRoutes =
    require("./routes/authRoutes");

const foodRoutes =
    require("./routes/foodRoutes");

const orderRoutes =
    require("./routes/orderRoutes");

const contactRoutes =
    require("./routes/contactRoutes");

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
/*
   Security response headers.

   Frontend Netlify lo, backend Render lo
   different origins kabatti uploaded images
   cross-origin ga load avvadaniki allow chestunnam.

   Backend mostly JSON API responses istundi kabatti
   document-specific CSP disable chestunnam.
*/

app.use(
    helmet({
        contentSecurityPolicy: false,

        crossOriginResourcePolicy: {
            policy: "cross-origin"
        }
    })
);

/*
   Render reverse proxy venuka application
   run avutundi.

   Correct customer IP address ni Express
   identify cheyyadaniki production lo
   one proxy hop trust chestunnam.
*/

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

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

        return callback(corsError);
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
   RATE LIMITERS
========================================= */

/*
   General API limiter:

   One IP address nunchi
   15 minutes lo maximum 300 API requests.
*/

const apiLimiter = rateLimit({
    windowMs:
        15 * 60 * 1000,

    limit: 300,

    standardHeaders:
        "draft-8",

    legacyHeaders:
        false,

    message: {
        success: false,
        message:
            "Too many requests. Please wait for a few minutes and try again."
    }
});

/*
   Authentication limiter:

   Login, register, forgot password and
   reset password routes kosam stricter limit.

   One IP address nunchi
   15 minutes lo maximum 30 attempts.
*/

const authLimiter = rateLimit({
    windowMs:
        15 * 60 * 1000,

    limit: 30,

    standardHeaders:
        "draft-8",

    legacyHeaders:
        false,

    message: {
        success: false,
        message:
            "Too many authentication attempts. Please wait for 15 minutes and try again."
    }
});

/*
   Contact form limiter:

   One IP address nunchi
   one hour lo maximum 5 messages.
*/

const contactLimiter = rateLimit({
    windowMs:
        60 * 60 * 1000,

    limit: 5,

    standardHeaders:
        "draft-8",

    legacyHeaders:
        false,

    message: {
        success: false,
        message:
            "Too many messages submitted. Please try again later."
    }
});

/*
   General limiter ni anni API routes ki
   apply chestunnam.
*/

app.use(
    "/api",
    apiLimiter
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

/*
   Authentication routes ki
   additional strict limiter.
*/

app.use(
    "/api/auth",
    authLimiter,
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

/*
   Contact POST request ki matrame
   contact spam limiter apply avutundi.

   Admin GET and PATCH requests ki
   contactLimiter apply avvadu.
*/

app.post(
    "/api/contact",
    contactLimiter
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