"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartRoutes = void 0;
// cart.route.ts
const express_1 = __importDefault(require("express"));
const cart_controller_1 = require("./cart.controller");
const checkAuth_1 = __importDefault(require("../../middleware/checkAuth"));
const enums_1 = require("../../generated/enums");
const router = express_1.default.Router();
router.post("/merge", (0, checkAuth_1.default)(enums_1.UserRole.CUSTOMER), cart_controller_1.cartController.createCart);
router.get("/", (0, checkAuth_1.default)(enums_1.UserRole.CUSTOMER), cart_controller_1.cartController.getCart);
exports.cartRoutes = router;
