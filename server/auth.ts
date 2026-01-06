import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import type { Request, Response, NextFunction, RequestHandler } from "express";

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;
const JWT_EXPIRES_IN = "7d";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required for production");
}

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function generateVerificationToken(): string {
  return randomBytes(20).toString("hex");
}

export function generateJWT(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyJWT(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET!) as JWTPayload;
}

function getAuthUser(req: Request): AuthUser | null {
  // After isAuthenticated middleware runs, req.auth will always be populated
  // for both session-based and JWT-based authentication
  return req.auth || null;
}

export const isAuthenticated: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check session first (for backward compatibility with existing frontend)
    if (req.session && req.session.userId && req.session.userEmail && req.session.userRole) {
      // Populate req.auth from session for downstream middleware compatibility
      req.auth = {
        userId: req.session.userId,
        email: req.session.userEmail,
        role: req.session.userRole,
      };
      return next();
    }

    // Check JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const token = authHeader.substring(7);
    const payload = verifyJWT(token);
    
    // Attach user info to request (stateless - no session creation)
    req.auth = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
};

export const isAdmin: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const user = getAuthUser(req);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  next();
};

export const isEmployer: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const user = getAuthUser(req);
  if (!user || user.role !== "employer") {
    return res.status(403).json({ message: "Forbidden: Employer access required" });
  }
  next();
};

export const isJobSeeker: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const user = getAuthUser(req);
  if (!user || user.role !== "job_seeker") {
    return res.status(403).json({ message: "Forbidden: Job seeker access required" });
  }
  next();
};

export function getUserId(req: Request): string {
  const user = getAuthUser(req);
  if (!user) {
    throw new Error("User not authenticated");
  }
  return user.userId;
}

declare module "express-session" {
  interface SessionData {
    userId: string;
    userRole: string;
    userEmail: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}
