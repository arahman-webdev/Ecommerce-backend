import express, { Request, Response } from "express"

import cors from "cors"
import cookieParser from "cookie-parser"
import { userRoutes } from "./modules/user/user.router";
import globalErrorHandler from "./middleware/globalErrorHandler";
import { authRoutes } from "./modules/auth/auth.router";
import { productRouter } from "./modules/products/product.router";
import { paymentRoutes } from "./modules/payment/payment.router";


// import { randomBytes } from "crypto";


export const app = express()
const corsOptions = {
    origin: [
        'http://localhost:3000',
       
        /\.vercel\.app$/ 
    ],
    credentials: true, // ← MUST BE TRUE
    exposedHeaders: ['set-cookie'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Origin']
};

app.use(cors(corsOptions));

app.use(cors(corsOptions));

// Or if you want to allow all origins in development
app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));

app.use(express.json())
app.use(cookieParser()); 


// router 

app.use('/api/auth', userRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/product', productRouter)
app.use('/api/payment', paymentRoutes)
// app.use('/api/tour', tourRoutes)
// app.use('/api/wishlist', wishlistRouter)
// app.use('/api/bookings', bookingRoutes)
// app.use('/api/payment', paymentRoutes)
// app.use('/api/reviews', reviewRoutes)

// Test route for Vercel
app.get("/test", (req, res) => {
  res.json({
    message: "API is working!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Default route testing

app.get('/',(req:Request, res:Response)=>{
    res.send("Abdur Rahman Server is running")
})

app.use(globalErrorHandler)

// const secretKey = randomBytes(32).toString("hex"); // Generates 32 random bytes and encodes to hex string
// console.log(secretKey);