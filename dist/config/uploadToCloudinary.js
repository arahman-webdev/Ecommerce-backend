"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = void 0;
const cloudinary_config_1 = require("./cloudinary.config");
const uploadToCloudinary = (fileBuffer, folder = "portfolio") => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_config_1.cloudinaryUpload.uploader.upload_stream({
            folder,
            resource_type: "image",
        }, (error, result) => {
            if (error || !result)
                reject(error);
            else
                resolve(result);
        });
        stream.end(fileBuffer);
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
