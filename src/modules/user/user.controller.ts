import { NextFunction, Response, Request } from "express"
import { UserService } from "./user.service"

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



export const UserController = {
  createUser,


}