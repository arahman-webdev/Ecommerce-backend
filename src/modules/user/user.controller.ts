import { NextFunction, Response, Request } from "express"
import { UserService } from "./user.service"
import AppError from "../../helper/AppError"
import { uploadToCloudinary } from "../../config/uploadToCloudinary"
import statusCodes from "http-status-codes"


const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await UserService.createUserService(req.body)

        res.status(201).json({
            status: true,
            message: "User created successfully",
            data: result
        })
    } catch (error) {
        next(error)
        console.log(error)
    }
}



const updateUser = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
        const userId = req.params.id
       
        if (req.user.userId !== userId) {
            throw new AppError(403, "You cannot update another user's profile");
        }
        let data = req.body
        if (data.data && typeof data.data === 'string') {
            data = JSON.parse(data.data)
        }
        let { name, email, bio, languages, travelPrefs, expertise, dailyRate, address, phone } = data;

        let profilePhoto: string | null = null;
        let profileId: string | null = null;


        // ✅ Upload image if exists
        if (req.file) {
            try {
                const uploaded = await uploadToCloudinary(req.file.buffer, "profile-image");
                profilePhoto = uploaded.secure_url;
                profileId = uploaded.public_id;
            } catch (uploadError: any) {
                throw new AppError(500, "Failed to upload image");
            }
        }

        const result = await UserService.updateUserService(userId, {
            name,
            email,
            bio,
            profilePhoto,
            profileId,
            address,
            phone
        })

        res.status(statusCodes.OK).json({
            status: true,
            message: "User updated successfully",
            data: result
        })
    } catch (error) {
        next(error)
        console.log(error)
    }
}



const getMyProfile = async (req: Request & { user?: any }, res: Response) => {
    try {
        const user = req.user
        const result = await UserService.getMyProfile(user as any)
        console.log(result)
        res.status(201).json({
            status: true,
            message: "Me retrieved successfully",
            data: result,

        })
    } catch (err) {
        console.log(err)
    }
}


export const UserController = {
  createUser,
  updateUser,
  getMyProfile

}