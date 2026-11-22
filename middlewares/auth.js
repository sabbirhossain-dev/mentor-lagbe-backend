import { createRemoteJWKSet, jwtVerify } from "jose";
import { usersCollection, toObjectId } from "../db.js";

const AUTH_URL =
  process.env.AUTH_URL ||
  (process.env.NODE_ENV === "production" || process.env.VERCEL
    ? "https://mentorlagbe-frontend-three.vercel.app"
    : "http://localhost:3000");
const JWKS = createRemoteJWKSet(new URL(`${AUTH_URL}/api/auth/jwks`));

/**
 * Verify JWT token from Better Auth and attach the user record from MongoDB
 */
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Token missing",
      });
    }

    const token = authHeader.split(" ")[1];
    const { payload } = await jwtVerify(token, JWKS);

    if (!payload.sub) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    // Always fetch latest user data and role directly from database
    const objectId = toObjectId(payload.sub);
    const query = objectId
      ? { $or: [{ _id: objectId }, { _id: payload.sub }] }
      : { _id: payload.sub };

    const user = await usersCollection.findOne(query);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found in database",
      });
    }

    req.user = {
      id: user._id.toString(),
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || "student",
      plan: user.plan || "free",
      image: user.image || null,
      phone: user.phone || "",
      bio: user.bio || "",
    };

    next();
  } catch (error) {
    console.error("JWT verification error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

/**
 * Middleware: Verify student role
 */
export const verifyStudent = (req, res, next) => {
  if (req.user?.role !== "student") {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Student access required",
    });
  }
  next();
};

/**
 * Middleware: Verify tutor role
 */
export const verifyTutor = (req, res, next) => {
  if (req.user?.role !== "tutor") {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Tutor access required",
    });
  }
  next();
};

/**
 * Middleware: Verify admin role
 */
export const verifyAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Admin access required",
    });
  }
  next();
};
