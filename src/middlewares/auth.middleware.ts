import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

interface JwtPayload {
    id: string;
    role: string;
}

/**
 * Middleware to protect routes and verify JWT
 */
export const protect = (req: Request, _: Response, next: NextFunction) => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        const error: any = new Error("No token provided");
        error.statusCode = 401;
        return next(error);
    }

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(
            token,
            config.jwt.accessSecret
        ) as JwtPayload;

        req.user = {
            id: decoded.id,
            role: decoded.role,
        };

        next();
    } catch (err: any) {
        err.statusCode = 401;
        err.message = "Invalid or expired token";
        next(err);
    }
};

/**
 * Middleware to restrict access based on user roles
 */
export const authorize = (...roles: string[]) => {
    return (req: Request, _: Response, next: NextFunction) => {
        if (!req.user) {
            const error: any = new Error("Authentication required");
            error.statusCode = 401;
            return next(error);
        }

        if (!roles.includes(req.user.role)) {
            const error: any = new Error(`Role '${req.user.role}' is not authorized to access this resource`);
            error.statusCode = 403;
            return next(error);
        }

        next();
    };
};