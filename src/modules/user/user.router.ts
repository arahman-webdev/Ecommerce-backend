
import express from "express"


// import { UserRole } from "@prisma/client"
import { UserController } from "./user.controller"

import { UserRole } from "../../generated/enums"
import { upload } from "../../config/multer.config"
import checkAuth from "../../middleware/checkAuth"



const router = express.Router()


router.post("/register", UserController.createUser)
router.patch("/register",  UserController.updateUser)
router.patch("/:id",checkAuth(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.SELLER), upload.single("image"), UserController.updateUser)
router.get("/me",checkAuth(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.SELLER), UserController.getMyProfile)



export const userRoutes = router