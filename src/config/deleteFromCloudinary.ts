import { cloudinaryUpload } from "./cloudinary.config";




export const deleteFromCloudinary = async (publicId: string) => {
  return await cloudinaryUpload.uploader.destroy(publicId);
};