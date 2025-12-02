import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
// import apiLimiter from "./middlewares/apiLimiter.js";

const app = express();

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",")
        : ["http://localhost:3000", "http://localhost:3001"];
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Middlewares
// // Apply the rate limiting middleware to all API routes
// app.use("/api/", apiLimiter);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public/upload"));

// Routes
import userRoutes from "./routers/user.routes.js";
import productRoutes from "./routers/product.routes.js";
import leadsRouter from "./routers/lead.routes.js";
import commentsRouter from "./routers/comment.routes.js";
import bannerRoutes from "./routers/banner.routes.js";
import categoryRoutes from "./routers/category.routes.js";
import subcategoryRouter from "./routers/subcategories.routes.js";

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/leads", leadsRouter);
app.use("/api/v1/comments", commentsRouter);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/banner", bannerRoutes);
app.use("/api/v1/subcategory", subcategoryRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);

  if (err instanceof Error) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

export default app;
