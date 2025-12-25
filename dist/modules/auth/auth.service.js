"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../../lib/prisma");
const enums_1 = require("../../generated/enums");
const jwt_1 = require("../../utills/jwt");
const userLogin = async (payload) => {
    const user = await prisma_1.prisma.user.findFirstOrThrow({
        where: {
            email: payload.email,
            status: enums_1.UserStatus.ACTIVE
        },
    });
    const isCorrecctedPassword = await bcryptjs_1.default.compare(payload.password, user.password);
    if (!isCorrecctedPassword) {
        throw new Error("Your password is not correct");
    }
    const jwtPayload = {
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role
    };
    const userToken = (0, jwt_1.generateToken)(jwtPayload, process.env.JWT_ACCESS_SECRET, process.env.JWT_EXPIRATION || "1d");
    const refreshToken = (0, jwt_1.generateToken)(jwtPayload, process.env.JWT_REFRESH_SECRET, process.env.JWT_REFRESH_EXPIRES_IN || "7d");
    return {
        accessToken: userToken,
        refreshToken,
        user
    };
};
exports.authService = {
    userLogin
};
