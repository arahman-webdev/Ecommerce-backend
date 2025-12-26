
import express from "express"


// import { UserRole } from "@prisma/client"
import { UserController } from "./user.controller"

import { UserRole } from "../../generated/enums"
import { upload } from "../../config/multer.config"
import checkAuth from "../../middleware/checkAuth"



const router = express.Router()

router.post("/register", UserController.createUser)
router.get("/users", UserController.getAllUsers)
router.patch("/:id",checkAuth(UserRole.SELLER, UserRole.CUSTOMER,UserRole.ADMIN), upload.single("image"), UserController.updateUser)
router.get("/me",checkAuth(UserRole.ADMIN, UserRole.SELLER, UserRole.CUSTOMER), UserController.getMyProfile)
router.patch("/status/:userId",checkAuth(UserRole.ADMIN),UserController.updateUserStatus);



export const userRoutes = router