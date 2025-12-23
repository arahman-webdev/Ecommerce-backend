
import express from "express"


// import { UserRole } from "@prisma/client"
import { UserController } from "./user.controller"

import { UserRole } from "../../generated/enums"
import { upload } from "../../config/multer.config"



const router = express.Router()


router.post("/register", UserController.createUser)
router.post("/register",  UserController.updateUser)
router.patch("/:id", upload.single("image"), UserController.updateUser)
router.get("/me", UserController.getMyProfile)



export const userRoutes = router