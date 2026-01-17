"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = exports.updateUserService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../../lib/prisma");
const client_1 = require("../../generated/client");
const deleteFromCloudinary_1 = require("../../config/deleteFromCloudinary");
const AppError_1 = __importDefault(require("../../helper/AppError"));
const createUserService = async (payload) => {
    const { email, password, ...rest } = payload;
    // Check if user already exists
    const isExistingUser = await prisma_1.prisma.user.findUnique({
        where: { email }
    });
    if (isExistingUser) {
        throw new Error("User is already exist");
    }
    // Hash the password
    const hashPassword = await bcryptjs_1.default.hash(password, Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
    // Create user with hashed password
    const user = await prisma_1.prisma.user.create({
        data: {
            ...rest,
            email,
            password: hashPassword
        }
    });
    // Remove password from returned user object for security
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
};
const getAllUsers = async () => {
    return prisma_1.prisma.user.findMany({
        orderBy: { createdAt: "desc" },
    });
};
const updateUserService = async (id, payload) => {
    const { email, password, profilePhoto, profileId, ...rest } = payload;
    // Check if user exists
    const existingUser = await prisma_1.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
        throw new AppError_1.default(404, "User not found");
    }
    // Check if email is being updated
    if (email && email !== existingUser.email) {
        const emailExists = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (emailExists) {
            throw new AppError_1.default(400, "Email already taken");
        }
    }
    // Delete old profile picture from Cloudinary if exists
    if (profileId && existingUser.profileId) {
        try {
            await (0, deleteFromCloudinary_1.deleteFromCloudinary)(existingUser.profileId);
        }
        catch (err) {
            console.error("Failed to delete old profile picture:", err);
        }
    }
    // Update user
    const user = await prisma_1.prisma.user.update({
        where: { id },
        data: {
            ...rest,
            ...(email && { email }),
            ...(profilePhoto && { profilePhoto }),
            ...(profileId && { profileId }),
        },
    });
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
};
exports.updateUserService = updateUserService;
const getMyProfile = async (user) => {
    // Step 1 — fetch basic info & ensure active
    const userInfo = await prisma_1.prisma.user.findUniqueOrThrow({
        where: {
            email: user.userEmail,
            status: client_1.UserStatus.ACTIVE
        },
        select: {
            id: true,
            email: true,
            role: true,
            status: true,
        }
    });
    // Step 2 — fetch full profile (same for all roles)
    const profile = await prisma_1.prisma.user.findUniqueOrThrow({
        where: { email: userInfo.email }
    });
    // Step 3 — remove password before returning
    const { password, ...cleanProfile } = profile;
    return {
        ...userInfo,
        ...cleanProfile
    };
};
const updateUserStatus = async (userId, status) => {
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new AppError_1.default(404, "User not found");
    if (user.role === client_1.UserRole.ADMIN) {
        throw new AppError_1.default(403, "You cannot modify another admin");
    }
    return prisma_1.prisma.user.update({
        where: { id: userId },
        data: { status },
    });
};
exports.UserService = {
    createUserService,
    updateUserService: exports.updateUserService,
    updateUserStatus,
    getAllUsers,
    getMyProfile
};
