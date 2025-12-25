"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const client_1 = require("../generated/client");
const globalErrorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let success = false;
    let message = err.message || "Internal Server Error";
    let error = err;
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
            // console.log(err?.meta?.driverAdapterError?.cause?.constraint?.fields[0])
            message = `This ${err?.meta?.modelName} already exists.`,
                error = err?.meta,
                statusCode = http_status_codes_1.default.BAD_REQUEST;
        }
        if (err.code === "P2013") {
            message = `${err.meta?.target} is required.`,
                error = err,
                statusCode = http_status_codes_1.default.BAD_REQUEST;
            console.log("from global handler error", message);
        }
        if (err.code === "P2025") {
            message = `${err?.meta?.modelName} not found.`,
                error = err,
                statusCode = http_status_codes_1.default.NOT_FOUND;
        }
        if (err.code === "P2003") {
            message = `${err?.meta?.constraint} is required`,
                error = err,
                statusCode = http_status_codes_1.default.BAD_REQUEST;
        }
    }
    else if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        message = "Validation Error",
            error = err.message,
            statusCode = http_status_codes_1.default.BAD_REQUEST;
    }
    else if (err instanceof client_1.Prisma.PrismaClientUnknownRequestError) {
        message = "Unknown Prisma error occured!",
            error = err.message,
            statusCode = http_status_codes_1.default.BAD_REQUEST;
    }
    else if (err instanceof client_1.Prisma.PrismaClientInitializationError) {
        message = "Prisma client failed to initialize!",
            error = err.message,
            statusCode = http_status_codes_1.default.BAD_REQUEST;
    }
    res.status(statusCode).json({
        success,
        message,
        error
    });
};
exports.default = globalErrorHandler;
