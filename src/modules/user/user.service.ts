import bcryptjs from "bcryptjs";
import statusCodes from "http-status-codes"
import { prisma } from "../../lib/prisma";
import { Prisma } from "../../generated/client";



const createUserService = async (payload: Prisma.UserCreateInput) => {
  const { email, password, ...rest } = payload;

  // Check if user already exists
  const isExistingUser = await prisma.user.findUnique({
    where: { email }
  });

  if(isExistingUser){
    throw new Error("User is already exist")
  }


  // Hash the password
  const hashPassword = await bcryptjs.hash(
    password as string,
    Number(process.env.BCRYPT_SALT_ROUNDS) || 12
  );

  // Create user with hashed password
  const user = await prisma.user.create({
    data: {
      ...rest,
      email,
      password: hashPassword
    }
  });

  // Remove password from returned user object for security
  const { password: _, ...userWithoutPassword } = user;

  return userWithoutPassword;
}







export const UserService = {
  createUserService,

}