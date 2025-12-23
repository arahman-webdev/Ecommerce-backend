import dotenv from "dotenv";
import { app } from "./app";
import { prisma } from "./lib/prisma";


dotenv.config();

// Connect to database
async function connectionDB() {
  try {
    await prisma.$connect();
    console.log("✅ Prisma connected successfully");
    return true;
  } catch (err) {
    console.error("❌ Prisma connection failed:", err);
    return false;
  }
}

// Health check endpoint
app.get("/health", async (req, res) => {
  const dbConnected = await connectionDB();
  
  res.json({
    status: dbConnected ? "healthy" : "unhealthy",
    database: dbConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Additional info endpoint
app.get("/api/info", (req, res) => {
  res.json({
    name: "Local Guide API",
    version: "1.0.0",
    status: "running",
  });
});

// Start server only in development/local
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  
  connectionDB().then((connected) => {
    if (connected) {
      app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
      });
    } else {
      console.error("❌ Cannot start server without database connection");
      process.exit(1);
    }
  });
}

// Export the app for Vercel
export default app;