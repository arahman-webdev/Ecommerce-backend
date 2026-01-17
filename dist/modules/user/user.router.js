"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = __importDefault(require("express"));
// import { UserRole } from "@prisma/client"
const user_controller_1 = require("./user.controller");
const enums_1 = require("../../generated/enums");
const multer_config_1 = require("../../config/multer.config");
const checkAuth_1 = __importDefault(require("../../middleware/checkAuth"));
const router = express_1.default.Router();
router.post("/register", user_controller_1.UserController.createUser);
router.get("/users", user_controller_1.UserController.getAllUsers);
router.patch("/:id", (0, checkAuth_1.default)(enums_1.UserRole.SELLER, enums_1.UserRole.CUSTOMER, enums_1.UserRole.ADMIN), multer_config_1.upload.single("image"), user_controller_1.UserController.updateUser);
router.get("/me", (0, checkAuth_1.default)(enums_1.UserRole.ADMIN, enums_1.UserRole.SELLER, enums_1.UserRole.CUSTOMER), user_controller_1.UserController.getMyProfile);
router.patch("/status/:userId", (0, checkAuth_1.default)(enums_1.UserRole.ADMIN), user_controller_1.UserController.updateUserStatus);
exports.userRoutes = router;
