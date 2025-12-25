"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_service_1 = require("./auth.service");
const userLogin = async (req, res, next) => {
    try {
        const result = await auth_service_1.authService.userLogin(req.body);
        const { accessToken, refreshToken } = result;
        // Get frontend origin from headers
        const frontendOrigin = req.headers.origin || '';
        console.log('Login request from origin:', frontendOrigin);
        // Check environment
        const isLocalhost = frontendOrigin.includes('localhost');
        const isVercel = frontendOrigin.includes('vercel.app');
        const isProduction = process.env.NODE_ENV === 'production';
        // Base cookie options
        const cookieOptions = {
            httpOnly: true,
            maxAge: 1000 * 60 * 60, // 1 hour
            path: '/',
        };
        // Set secure and sameSite based on environment
        if (isLocalhost) {
            // Local development
            cookieOptions.secure = false;
            cookieOptions.sameSite = 'lax';
        }
        else if (isVercel) {
            // Vercel deployment (production)
            cookieOptions.secure = true;
            cookieOptions.sameSite = 'none';
            cookieOptions.domain = '.vercel.app'; // ← CRITICAL: Dot at start!
        }
        else {
            // Other production
            cookieOptions.secure = true;
            cookieOptions.sameSite = 'none';
        }
        console.log('Cookie options:', cookieOptions);
        // Set accessToken cookie
        res.cookie("accessToken", accessToken, cookieOptions);
        // Set userRole cookie (important for middleware)
        res.cookie("userRole", result.user?.role || 'TOURIST', cookieOptions);
        // Set refreshToken with longer expiry
        res.cookie("refreshToken", refreshToken, {
            ...cookieOptions,
            maxAge: 1000 * 60 * 60 * 24 * 90, // 90 days
        });
        res.status(201).json({
            status: true,
            message: "User logged in successfully",
            data: {
                ...result,
                accessToken, // Also return for localStorage backup
                refreshToken
            }
        });
    }
    catch (err) {
        next(err);
        console.log(err);
    }
};
const logoutUser = (req, res) => {
    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie('accessToken', {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: "/"
    });
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: "/"
    });
    res.status(201).json({
        success: true,
        message: "User logged out successfully",
        data: null
    });
};
exports.authController = {
    userLogin,
    logoutUser
};
