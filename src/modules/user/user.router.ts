
import express from "express"


// import { UserRole } from "@prisma/client"
import { UserController } from "./user.controller"

import { UserRole } from "../../generated/enums"



const router = express.Router()


router.post("/register", UserController.createUser)



export const userRoutes = router