
import bcryptjs from "bcryptjs"
import jwt from "jsonwebtoken"

import { prisma } from "../../lib/prisma"
import { UserStatus } from "../../generated/enums"
import { generateToken } from "../../utills/jwt"


const userLogin = async (payload: { email: string, password: string }) => {

    const user = await prisma.user.findFirstOrThrow({
        where: {
            email: payload.email,
            status: UserStatus.ACTIVE
        },
       
    })


    const isCorrecctedPassword = await bcryptjs.compare(payload.password, user.password as string)

    if (!isCorrecctedPassword) {
        throw new Error("Your password is not correct")
    }


    const jwtPayload = {
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role
    }


    const userToken = generateToken(jwtPayload, process.env.JWT_ACCESS_SECRET as string, process.env.JWT_EXPIRATION || "1d")

    const refreshToken = generateToken(jwtPayload, process.env.JWT_REFRESH_SECRET as string, process.env.JWT_REFRESH_EXPIRES_IN || "7d")

    return {
        accessToken: userToken,
        refreshToken,
        user
    }
}

export const authService = {
    userLogin
}