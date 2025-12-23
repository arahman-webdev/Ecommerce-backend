import { NextFunction, Request, Response } from "express";


import { JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { verifyToken } from "../utills/jwt";

const checkAuth =
    (...authRoles: string[]) =>
        async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
            try {
                let token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-access-token'] || req.cookies.accessToken;

                if (!token) {
                    throw new Error("Token is not found");
                }

                // Extract token from "Bearer xxx"
                if (typeof token === "string" && token.startsWith("Bearer ")) {
                    token = token.split(" ")[1];
                }




                const verifiedToken = verifyToken(token, process.env.JWT_ACCESS_SECRET as string) as JwtPayload

               

                const user = await prisma.user.findUnique({
                    where: { email: verifiedToken.userEmail },
                });

                if (!user) {
                    throw new Error("User not found");
                }

                // Role check (skip if no role provided)
                if (authRoles.length > 0 && !authRoles.includes(verifiedToken.userRole)) {
                    throw new Error("You are not authorized to view this");
                }

                req.user = verifiedToken;
                next();
            } catch (err) {
                console.log(err);
                next(err);
            }
        };

export default checkAuth;