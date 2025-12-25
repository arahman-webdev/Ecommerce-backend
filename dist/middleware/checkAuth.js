"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../lib/prisma");
const jwt_1 = require("../utills/jwt");
const checkAuth = (...authRoles) => async (req, res, next) => {
    try {
        let token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-access-token'] || req.cookies.accessToken;
        if (!token) {
            throw new Error("Token is not found");
        }
        // Extract token from "Bearer xxx"
        if (typeof token === "string" && token.startsWith("Bearer ")) {
            token = token.split(" ")[1];
        }
        const verifiedToken = (0, jwt_1.verifyToken)(token, process.env.JWT_ACCESS_SECRET);
        const user = await prisma_1.prisma.user.findUnique({
            where: { email: verifiedToken.userEmail },
        });
        if (!user) {
            throw new Error("User not found");
        }
        // Role check (skip if no role provided)
        if (authRoles.length > 0 && !authRoles.includes(verifiedToken.userRole)) {
            throw new Error("You are not authorized to view this");
        }
        req.user = verifiedToken;
        next();
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};
exports.default = checkAuth;
