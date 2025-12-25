"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const user_router_1 = require("./modules/user/user.router");
const auth_router_1 = require("./modules/auth/auth.router");
const globalErrorHandler_1 = __importDefault(require("./middleware/globalErrorHandler"));
const product_router_1 = require("./modules/products/product.router");
const wishlist_router_1 = require("./modules/wishlist/wishlist.router");
const payment_router_1 = require("./modules/payment/payment.router");
// import { randomBytes } from "crypto";
exports.app = (0, express_1.default)();
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'https://local-guide-frontend.vercel.app',
        /\.vercel\.app$/ // Allow all Vercel subdomains
    ],
    credentials: true, // ← MUST BE TRUE
    exposedHeaders: ['set-cookie'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Origin']
};
exports.app.use((0, cors_1.default)(corsOptions));
exports.app.use((0, cors_1.default)(corsOptions));
// Or if you want to allow all origins in development
exports.app.use((0, cors_1.default)({
    origin: true, // Allow all origins
    credentials: true
}));
exports.app.use(express_1.default.json());
exports.app.use((0, cookie_parser_1.default)());
// router 
exports.app.use('/api/auth', user_router_1.userRoutes);
exports.app.use('/api/auth', auth_router_1.authRoutes);
exports.app.use('/api/product', product_router_1.productRouter);
exports.app.use('/api/product', wishlist_router_1.wishlistRouter);
exports.app.use('/api/payment', payment_router_1.paymentRoutes);
// app.use('/api/tour', tourRoutes)
// app.use('/api/wishlist', wishlistRouter)
// app.use('/api/bookings', bookingRoutes)
// app.use('/api/payment', paymentRoutes)
// app.use('/api/reviews', reviewRoutes)
// Test route for Vercel
exports.app.get("/test", (req, res) => {
    res.json({
        message: "API is working!",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
    });
});
// Default route testing
exports.app.get('/', (req, res) => {
    res.send("Abdur Rahman Server is running");
});
exports.app.use(globalErrorHandler_1.default);
// const secretKey = randomBytes(32).toString("hex"); // Generates 32 random bytes and encodes to hex string
// console.log(secretKey);
