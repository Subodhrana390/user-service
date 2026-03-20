import cors from "cors";
import express, { Request, Response } from "express";
import fs from "fs";
import helmet from "helmet";
import path from "path";
import { errorMiddleware } from "./src/middlewares/error.middleware.js";
import userInternalRouter from "./src/routes/internal/user-internal.routes.js";
import userRouter from "./src/routes/user.routes.js";

const app = express();

const uploadDir = path.join(process.cwd(), "uploads/avatars");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(helmet());
app.use(
    cors({
        origin: "*",
    }),
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/health", (req: Request, res: Response) => {
    res.json({
        service: "user-service",
        status: "healthy",
        timestamp: new Date().toISOString(),
    });
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/internal/users", userInternalRouter);

app.use(errorMiddleware);

app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

export default app;
