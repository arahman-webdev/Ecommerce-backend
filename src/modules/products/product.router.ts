import express from "express"
import { productController } from "./product.controller"
import { upload } from "../../config/multer.config"
import checkAuth from "../../middleware/checkAuth"
import { UserRole } from "../../generated/enums"



const router = express.Router()

/* -----Product                Category----- */

router.post('/create-category', productController.createCategory)
router.delete('/category/:id', productController.deleteCategory)
router.get('/all-category', productController.getCategory)
router.put('/category/:id', productController.updateCategory)




/* -----Product           ----- */

router.post('/create', checkAuth(UserRole.SELLER), upload.array('images'), productController.createProduct)
router.put('/:id', checkAuth(UserRole.SELLER), upload.array('images'), productController.updateProduct)
router.get('/', productController.getProduct)
router.get('/:slug', productController.getSingleProduct)
router.delete('/:id', checkAuth(UserRole.SELLER, UserRole.ADMIN), productController.deleteProduct)


export const productRouter = router