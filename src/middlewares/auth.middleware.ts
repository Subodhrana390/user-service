import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

export const protect = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        const error: any = new Error("No token provided");
        error.statusCode = 401;
        throw error;
    }

    const token = header.split(" ")[1];
    try {
        const decoded = jwt.verify(
            token,
            config.jwt.accessSecret,
        );
        req.user = decoded as { id: string; role: string };
        next();
    } catch (err: any) {
        err.statusCode = 401;
        throw err;
    }
};

export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            const error: any = new Error("Not authorized to access this resource");
            error.statusCode = 401;
            throw error;
        }

        if (!roles.includes(req.user.role)) {
            const error: any = new Error("Not authorized to access this resource");
            error.statusCode = 403;
            throw error;
        }

        next();
    };
};
