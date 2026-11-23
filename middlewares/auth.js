import { createRemoteJWKSet, jwtVerify } from "jose";
import { usersCollection, toObjectId } from "../db.js";

// Determine remote JWKS endpoints.
// If deployed on Vercel or in production, localhost is unreachable, so prioritize production.
const PROD_AUTH_URL = "https://mentorlagbe-frontend-three.vercel.app";
const LOCAL_AUTH_URL = "http://localhost:3000";

const configuredAuthUrl = process.env.AUTH_URL?.trim();
const isProd = Boolean(process.env.VERCEL || process.env.NODE_ENV === "production");

const primaryBaseUrl = isProd
  ? (configuredAuthUrl && !configuredAuthUrl.includes("localhost") && !configuredAuthUrl.includes("127.0.0.1")
      ? configuredAuthUrl
      : PROD_AUTH_URL)
  : (configuredAuthUrl || LOCAL_AUTH_URL);

const fallbackBaseUrl = primaryBaseUrl.includes("vercel.app") ? LOCAL_AUTH_URL : PROD_AUTH_URL;

const primaryJWKS = createRemoteJWKSet(new URL(`${primaryBaseUrl.replace(/\/$/, "")}/api/auth/jwks`));
const fallbackJWKS = createRemoteJWKSet(new URL(`${fallbackBaseUrl.replace(/\/$/, "")}/api/auth/jwks`));

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
    let payload;

    try {
      const verified = await jwtVerify(token, primaryJWKS);
      payload = verified.payload;
    } catch (primaryErr) {
      // If primary JWKS failed, try fallback JWKS seamlessly
      try {
        const verified = await jwtVerify(token, fallbackJWKS);
        payload = verified.payload;
      } catch {
        throw primaryErr;
      }
    }

    if (!payload.sub) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    // Always fetch latest user data and role directly from database
    const objectId = toObjectId(payload.sub);
    const orConditions = [{ _id: payload.sub }];
    if (objectId) orConditions.push({ _id: objectId });
    if (payload.email && typeof payload.email === "string") {
      orConditions.push({ email: payload.email });
    }

    const user = await usersCollection.findOne({ $or: orConditions });

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
