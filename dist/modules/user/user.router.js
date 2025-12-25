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
router.post("/register", user_controller_1.UserController.updateUser);
router.patch("/:id", (0, checkAuth_1.default)(enums_1.UserRole.ADMIN, enums_1.UserRole.CUSTOMER, enums_1.UserRole.SELLER), multer_config_1.upload.single("image"), user_controller_1.UserController.updateUser);
router.get("/me", (0, checkAuth_1.default)(enums_1.UserRole.ADMIN, enums_1.UserRole.CUSTOMER, enums_1.UserRole.SELLER), user_controller_1.UserController.getMyProfile);
exports.userRoutes = router;
