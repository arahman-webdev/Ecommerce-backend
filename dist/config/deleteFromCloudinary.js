"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCloudinary = void 0;
const cloudinary_config_1 = require("./cloudinary.config");
const deleteFromCloudinary = async (publicId) => {
    return await cloudinary_config_1.cloudinaryUpload.uploader.destroy(publicId);
};
exports.deleteFromCloudinary = deleteFromCloudinary;
