
import { UploadApiResponse } from "cloudinary";
import { cloudinaryUpload } from "./cloudinary.config";

export const uploadToCloudinary = (fileBuffer: Buffer,folder = "portfolio"): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinaryUpload.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) reject(error);
        else resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};