"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRouter = void 0;
const express_1 = __importDefault(require("express"));
const product_controller_1 = require("./product.controller");
const multer_config_1 = require("../../config/multer.config");
const checkAuth_1 = __importDefault(require("../../middleware/checkAuth"));
const enums_1 = require("../../generated/enums");
const router = express_1.default.Router();
/* -----Product                Category----- */
router.post('/create-category', product_controller_1.productController.createCategory);
router.delete('/category/:id', product_controller_1.productController.deleteCategory);
router.get('/all-category', product_controller_1.productController.getCategory);
router.put('/category/:id', product_controller_1.productController.updateCategory);
/* -----Product           ----- */
router.post('/create', (0, checkAuth_1.default)(enums_1.UserRole.SELLER), multer_config_1.upload.array('images'), product_controller_1.productController.createProduct);
router.put('/:id', (0, checkAuth_1.default)(enums_1.UserRole.SELLER), multer_config_1.upload.array('images'), product_controller_1.productController.updateProduct);
router.get('/', product_controller_1.productController.getProduct);
router.get('/:slug', product_controller_1.productController.getSingleProduct);
router.delete('/:id', (0, checkAuth_1.default)(enums_1.UserRole.SELLER, enums_1.UserRole.ADMIN), product_controller_1.productController.deleteProduct);
exports.productRouter = router;
