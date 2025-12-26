import bcryptjs from "bcryptjs";
import statusCodes from "http-status-codes"
import { prisma } from "../../lib/prisma";
import { Prisma, UserRole, UserStatus } from "../../generated/client";
import { deleteFromCloudinary } from "../../config/deleteFromCloudinary";
import AppError from "../../helper/AppError";



const createUserService = async (payload: Prisma.UserCreateInput) => {
  const { email, password, ...rest } = payload;

  // Check if user already exists
  const isExistingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (isExistingUser) {
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


const getAllUsers = async () => {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
};


interface UpdateUserPayload extends Partial<Prisma.UserUpdateInput> {
  profilePhoto?: string; // the new image URL or ID
  profileId?: string;
  email: string;  // Cloudinary publicId of the new image
}

export const updateUserService = async (
  id: string,
  payload: UpdateUserPayload
) => {
  const { email, password, profilePhoto, profileId, ...rest } = payload;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    throw new AppError(404, "User not found");
  }

  // Check if email is being updated
  if (email && email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      throw new AppError(400, "Email already taken");
    }
  }

  // Delete old profile picture from Cloudinary if exists
  if (profileId && existingUser.profileId) {
    try {
      await deleteFromCloudinary(existingUser.profileId);
    } catch (err) {
      console.error("Failed to delete old profile picture:", err);
    }
  }

  // Update user
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...rest,
      ...(email && { email }),

      ...(profilePhoto && { profilePhoto }),
      ...(profileId && { profileId }),
    },
  });

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const getMyProfile = async (user: any) => {
  // Step 1 — fetch basic info & ensure active
  const userInfo = await prisma.user.findUniqueOrThrow({
    where: {
      email: user.userEmail,
      status: UserStatus.ACTIVE
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
    }
  });

  // Step 2 — fetch full profile (same for all roles)
  const profile = await prisma.user.findUniqueOrThrow({
    where: { email: userInfo.email }
  });

  // Step 3 — remove password before returning
  const { password, ...cleanProfile } = profile;

  return {
    ...userInfo,
    ...cleanProfile
  };
};



const updateUserStatus = async (userId: string, status: UserStatus) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) throw new AppError(404, "User not found");


  if (user.role === UserRole.ADMIN) {
    throw new AppError(403, "You cannot modify another admin");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { status },
  });
};


export const UserService = {
  createUserService,
  updateUserService,
  updateUserStatus,
  getAllUsers,
  getMyProfile

}