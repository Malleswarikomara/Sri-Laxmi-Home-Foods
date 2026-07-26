const jwt = require("jsonwebtoken");

const User = require("../models/User");

/* =========================================
   PROTECT ROUTES
========================================= */

const protect = async (
    req,
    res,
    next
) => {
    try {
        const authHeader =
            req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Please login to continue."
            });
        }

        const token =
            authHeader
                .split(" ")[1]
                ?.trim();

        if (!token) {
            return res.status(401).json({
                success: false,
                message:
                    "Login token is missing."
            });
        }

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        const user =
            await User.findById(
                decoded.id
            ).select(
                "_id name email phone role"
            );

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    "User account no longer exists."
            });
        }

        req.user = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role
        };

        next();

    } catch (error) {
        if (
            error.name ===
            "TokenExpiredError"
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Your login session has expired. Please login again."
            });
        }

        return res.status(401).json({
            success: false,
            message:
                "Invalid login token. Please login again."
        });
    }
};

/* =========================================
   ADMIN ACCESS ONLY
========================================= */

const adminOnly = (
    req,
    res,
    next
) => {
    if (
        !req.user ||
        req.user.role !== "admin"
    ) {
        return res.status(403).json({
            success: false,
            message:
                "Admin access is required."
        });
    }

    next();
};

/*
   Existing routes lo:
   const protect = require(...)
   ani unte break avvakunda preserve chestunnam.
*/

module.exports = protect;
module.exports.protect = protect;
module.exports.adminOnly = adminOnly;