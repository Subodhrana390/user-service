import crypto from "crypto";
import { Request } from "express";

/**
 * Generate a secure random token
 * @param {number} length - Length of the token in bytes (will be hex encoded, so double length)
 * @returns {string} - Hex encoded token
 */
export const generateSecureToken = (length: number = 16): string => {
    return crypto.randomBytes(length).toString("hex");
};

/**
 * Hash a token using SHA-256
 * @param {string} token - Token to hash
 * @returns {string} - Hashed token
 */
export const hashToken = (token: string): string => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Get token expiration date
 * @param {number} hours - Hours from now
 * @returns {Date} - Expiration date
 */
export const getTokenExpiration = (hours: number = 24): Date => {
    return new Date(Date.now() + hours * 60 * 60 * 1000);
};

/**
 * Check if a date is expired
 * @param {Date} date - Date to check
 * @returns {boolean} - True if expired
 */
export const isExpired = (date: Date): boolean => {
    return new Date() > date;
};

/**
 * Get client IP address from request
 * @param {Request} req - Express request object
 * @returns {string} - IP address
 */
export const getClientIP = (req: Request): string => {
    const forwarded = req.headers["x-forwarded-for"];
    const ip = typeof forwarded === "string"
        ? forwarded.split(",")[0].trim()
        : req.socket?.remoteAddress ||
        "unknown";

    // Handle IPv4-mapped IPv6 addresses
    if (ip.includes("::ffff:")) {
        return ip.split("::ffff:")[1];
    }

    return ip;
};

/**
 * Parse user agent to determine device type
 * @param {string} userAgent - User agent string
 * @returns {string} - Device type
 */
export const parseUserAgent = (userAgent: string | undefined): string => {
    if (!userAgent) return "unknown";

    const ua = userAgent.toLowerCase();

    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
        return "mobile";
    } else if (ua.includes("tablet") || ua.includes("ipad")) {
        return "tablet";
    } else {
        return "desktop";
    }
};

/**
 * Sanitize filename for safe storage
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
export const sanitizeFilename = (filename: string): string => {
    return filename.replace(/[^a-zA-Z0-9.-]/g, "_");
};

/**
 * Generate pagination info
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} - Pagination info
 */
export const getPaginationInfo = (page: number, limit: number, total: number) => {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNext,
        hasPrev,
    };
};

/**
 * Search query builder for MongoDB
 * @param {string} searchTerm - Search term
 * @param {Array<string>} fields - Fields to search in
 * @returns {Object} - MongoDB search query
 */
export const buildSearchQuery = (searchTerm: string, fields: string[] = ["name", "email"]) => {
    if (!searchTerm) return {};

    const searchRegex = new RegExp(searchTerm, "i");
    const searchConditions = fields.map(field => ({
        [field]: searchRegex
    }));

    return { $or: searchConditions };
};

/**
 * Format user data for API response
 * @param {any} user - User document
 * @param {boolean} includeSensitive - Include sensitive data
 * @returns {Object} - Formatted user data
 */
export const formatUserResponse = (user: any, includeSensitive: boolean = false) => {
    const baseData = {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        countryCode: user.countryCode,
        avatar: user.avatar,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };

    if (includeSensitive) {
        return {
            ...baseData,
            loginCount: user.loginCount,
            provider: user.provider,
            providerId: user.providerId,
            twoFactorEnabled: user.twoFactorEnabled,
        };
    }

    return baseData;
};
