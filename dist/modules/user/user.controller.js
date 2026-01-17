"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("./user.service");
const AppError_1 = __importDefault(require("../../helper/AppError"));
const uploadToCloudinary_1 = require("../../config/uploadToCloudinary");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const enums_1 = require("../../generated/enums");
const createUser = async (req, res, next) => {
    try {
        const result = await user_service_1.UserService.createUserService(req.body);
        res.status(201).json({
            status: true,
            message: "User created successfully",
            data: result
        });
    }
    catch (error) {
        next(error);
        console.log(error);
    }
};
const updateUser = async (req, res, next) => {
    try {
        const userId = req.params.id;
        if (req.user.userId !== userId) {
            throw new AppError_1.default(403, "You cannot update another user's profile");
        }
        let data = req.body;
        if (data.data && typeof data.data === 'string') {
            data = JSON.parse(data.data);
        }
        let { name, email, bio, languages, travelPrefs, expertise, dailyRate, address, phone } = data;
        let profilePhoto = null;
        let profileId = null;
        // ✅ Upload image if exists
        if (req.file) {
            try {
                const uploaded = await (0, uploadToCloudinary_1.uploadToCloudinary)(req.file.buffer, "profile-image");
                profilePhoto = uploaded.secure_url;
                profileId = uploaded.public_id;
            }
            catch (uploadError) {
                throw new AppError_1.default(500, "Failed to upload image");
            }
        }
        const result = await user_service_1.UserService.updateUserService(userId, {
            name,
            email,
            bio,
            profilePhoto,
            profileId,
            address,
            phone
        });
        res.status(http_status_codes_1.default.OK).json({
            status: true,
            message: "User updated successfully",
            data: result
        });
    }
    catch (error) {
        next(error);
        console.log(error);
    }
};
const getMyProfile = async (req, res) => {
    try {
        const user = req.user;
        const result = await user_service_1.UserService.getMyProfile(user);
        console.log(result);
        res.status(201).json({
            status: true,
            message: "Me retrieved successfully",
            data: result,
        });
    }
    catch (err) {
        console.log(err);
    }
};
const updateUserStatus = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const { status } = req.body;
        if (!status || !(status in enums_1.UserStatus)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }
        const updated = await user_service_1.UserService.updateUserStatus(userId, status);
        res.status(http_status_codes_1.default.OK).json({
            success: true,
            message: `User status updated to ${status}`,
            data: updated,
        });
    }
    catch (error) {
        next(error);
    }
};
const getAllUsers = async (req, res, next) => {
    try {
        const users = await user_service_1.UserService.getAllUsers();
        res.json({
            success: true,
            message: "All users fetched",
            data: users,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.UserController = {
    createUser,
    updateUser,
    getMyProfile,
    updateUserStatus,
    getAllUsers
};
