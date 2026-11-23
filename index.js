import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";
import {
  usersCollection,
  tuitionsCollection,
  applicationsCollection,
  paymentsCollection,
  toObjectId,
} from "./db.js";
import {
  verifyToken,
  verifyStudent,
  verifyTutor,
  verifyAdmin,
} from "./middlewares/auth.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Robust CORS and Private Network Access middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.setHeader("Access-Control-Allow-Private-Network", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// CORS configuration fallback
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Root Route
app.get("/", (req, res) => {
  res.json("MentorLagbe API server in running");
});

// Health check endpoint for monitoring & deployment
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/* ==========================================================================
   TUITIONS ENDPOINTS (Public, Tutor, Admin)
   ========================================================================== */

// 1. GET /tuitions - Public search, filter, and pagination
app.get("/tuitions", async (req, res) => {
  try {
    const {
      search,
      subject,
      classLevel,
      mode,
      sort,
      page = 1,
      limit = 9,
    } = req.query;

    const query = {
      approvalStatus: "approved",
      isActive: true,
    };

    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: searchRegex },
        { subject: searchRegex },
        { location: searchRegex },
      ];
    }

    if (subject && subject !== "All" && subject.trim() !== "") {
      query.subject = { $regex: new RegExp(`^${subject.trim()}$`, "i") };
    }

    if (classLevel && classLevel !== "All" && classLevel.trim() !== "") {
      query.classLevel = { $regex: new RegExp(`^${classLevel.trim()}$`, "i") };
    }

    if (mode && mode !== "All" && mode.trim() !== "") {
      query.mode = mode.trim();
    }

    let sortOption = { createdAt: -1 };
    if (sort === "fee-low") sortOption = { monthlyFee: 1 };
    if (sort === "fee-high") sortOption = { monthlyFee: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 9);
    const skip = (pageNum - 1) * limitNum;

    const [tuitions, total] = await Promise.all([
      tuitionsCollection
        .find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .toArray(),
      tuitionsCollection.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      tuitions,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("Error fetching tuitions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tuitions",
    });
  }
});

// 2. GET /tuitions/featured - 6 latest approved & active tuitions for Landing page
app.get("/tuitions/featured", async (req, res) => {
  try {
    const featured = await tuitionsCollection
      .find({ approvalStatus: "approved", isActive: true })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();

    res.status(200).json({
      success: true,
      tuitions: featured,
    });
  } catch (error) {
    console.error("Error fetching featured tuitions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch featured tuitions",
    });
  }
});

// 3. GET /tuitions/:id - Single tuition details
app.get("/tuitions/:id", async (req, res) => {
  try {
    const objectId = toObjectId(req.params.id);
    if (!objectId) {
      return res.status(400).json({
        success: false,
        message: "Invalid tuition ID",
      });
    }

    const tuition = await tuitionsCollection.findOne({ _id: objectId });

    if (!tuition) {
      return res.status(404).json({
        success: false,
        message: "Tuition not found",
      });
    }

    res.status(200).json({
      success: true,
      tuition,
    });
  } catch (error) {
    console.error("Error fetching tuition details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tuition details",
    });
  }
});

// 4. POST /tuitions - Create a tuition post (Tutor Only with Free / Pro plan limit check)
app.post("/tuitions", verifyToken, verifyTutor, async (req, res) => {
  try {
    const {
      title,
      subject,
      classLevel,
      mode,
      location,
      monthlyFee,
      daysPerWeek,
      bannerImage,
      description,
    } = req.body;

    if (!title || !subject || !classLevel || !monthlyFee) {
      return res.status(400).json({
        success: false,
        message: "Title, Subject, Class Level, and Monthly Fee are required.",
      });
    }

    // Free Plan check: max 2 tuition posts
    if (req.user.plan !== "pro") {
      const existingCount = await tuitionsCollection.countDocuments({
        tutorEmail: req.user.email,
      });

      if (existingCount >= 2) {
        return res.status(403).json({
          success: false,
          message:
            "Free Plan limit reached (max 2 tuitions). Upgrade to Pro Plan for unlimited posts.",
        });
      }
    }

    const newTuition = {
      title: title.trim(),
      subject: subject.trim(),
      classLevel: classLevel.trim(),
      mode: mode || "Online",
      location:
        location?.trim() || (mode === "Online" ? "Online" : "To be decided"),
      monthlyFee: Number(monthlyFee),
      daysPerWeek: daysPerWeek?.trim() || "3 Days / Week",
      bannerImage:
        bannerImage?.trim() ||
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
      description: description?.trim() || "",
      tutorName: req.user.name,
      tutorEmail: req.user.email,
      approvalStatus: "pending", // Always pending initially
      isActive: true,
      createdAt: new Date(),
    };

    const result = await tuitionsCollection.insertOne(newTuition);

    res.status(201).json({
      success: true,
      message:
        "Tuition post created successfully and is pending admin approval.",
      tuitionId: result.insertedId,
    });
  } catch (error) {
    console.error("Error creating tuition:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create tuition post",
    });
  }
});

// 5. GET /tutor/my-tuitions - Tutor's own tuitions list
app.get("/tutor/my-tuitions", verifyToken, verifyTutor, async (req, res) => {
  try {
    const tuitions = await tuitionsCollection
      .find({ tutorEmail: req.user.email })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      tuitions,
    });
  } catch (error) {
    console.error("Error fetching tutor tuitions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your tuitions",
    });
  }
});

// 6. PATCH /tuitions/:id - Update own tuition (Tutor Only)
app.patch("/tuitions/:id", verifyToken, verifyTutor, async (req, res) => {
  try {
    const objectId = toObjectId(req.params.id);
    if (!objectId) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await tuitionsCollection.findOne({
      _id: objectId,
      tutorEmail: req.user.email,
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message:
          "Tuition post not found or you do not have permission to edit it.",
      });
    }

    const {
      title,
      subject,
      classLevel,
      mode,
      location,
      monthlyFee,
      daysPerWeek,
      bannerImage,
      description,
    } = req.body;

    const updateFields = {
      ...(title && { title: title.trim() }),
      ...(subject && { subject: subject.trim() }),
      ...(classLevel && { classLevel: classLevel.trim() }),
      ...(mode && { mode: mode.trim() }),
      ...(location && { location: location.trim() }),
      ...(monthlyFee !== undefined && { monthlyFee: Number(monthlyFee) }),
      ...(daysPerWeek && { daysPerWeek: daysPerWeek.trim() }),
      ...(bannerImage && { bannerImage: bannerImage.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      updatedAt: new Date(),
    };

    await tuitionsCollection.updateOne(
      { _id: objectId },
      { $set: updateFields },
    );

    res.status(200).json({
      success: true,
      message: "Tuition updated successfully",
    });
  } catch (error) {
    console.error("Error updating tuition:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update tuition",
    });
  }
});

// 7. PATCH /tuitions/:id/toggle-status - Toggle Active / Closed (Tutor Only)
app.patch(
  "/tuitions/:id/toggle-status",
  verifyToken,
  verifyTutor,
  async (req, res) => {
    try {
      const objectId = toObjectId(req.params.id);
      if (!objectId) {
        return res.status(400).json({ success: false, message: "Invalid ID" });
      }

      const tuition = await tuitionsCollection.findOne({
        _id: objectId,
        tutorEmail: req.user.email,
      });

      if (!tuition) {
        return res.status(404).json({
          success: false,
          message: "Tuition not found or unauthorized.",
        });
      }

      const nextStatus = !tuition.isActive;
      await tuitionsCollection.updateOne(
        { _id: objectId },
        { $set: { isActive: nextStatus, updatedAt: new Date() } },
      );

      res.status(200).json({
        success: true,
        message: `Tuition is now ${nextStatus ? "Active" : "Closed"}`,
        isActive: nextStatus,
      });
    } catch (error) {
      console.error("Error toggling tuition status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to toggle tuition status",
      });
    }
  },
);

// 8. DELETE /tuitions/:id - Delete tuition post (Tutor Only)
app.delete("/tuitions/:id", verifyToken, verifyTutor, async (req, res) => {
  try {
    const objectId = toObjectId(req.params.id);
    if (!objectId) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const result = await tuitionsCollection.deleteOne({
      _id: objectId,
      tutorEmail: req.user.email,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Tuition not found or unauthorized",
      });
    }

    // Also remove associated applications
    await applicationsCollection.deleteMany({ tuitionId: req.params.id });

    res.status(200).json({
      success: true,
      message: "Tuition deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting tuition:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete tuition",
    });
  }
});

// 9. GET /admin/tuitions - All tuitions for Admin moderation
app.get("/admin/tuitions", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const tuitions = await tuitionsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      tuitions,
    });
  } catch (error) {
    console.error("Error fetching tuitions for admin:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tuitions",
    });
  }
});

// 10. PATCH /admin/tuitions/:id/approval - Approve or Reject tuition (Admin Only)
app.patch(
  "/admin/tuitions/:id/approval",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const objectId = toObjectId(req.params.id);
      if (!objectId) {
        return res.status(400).json({ success: false, message: "Invalid ID" });
      }

      const { approvalStatus } = req.body;
      if (!["approved", "rejected", "pending"].includes(approvalStatus)) {
        return res.status(400).json({
          success: false,
          message:
            "approvalStatus must be 'approved', 'rejected', or 'pending'",
        });
      }

      const result = await tuitionsCollection.updateOne(
        { _id: objectId },
        { $set: { approvalStatus, updatedAt: new Date() } },
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Tuition not found",
        });
      }

      res.status(200).json({
        success: true,
        message: `Tuition status updated to ${approvalStatus}`,
      });
    } catch (error) {
      console.error("Error updating approval status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update approval status",
      });
    }
  },
);

/* ==========================================================================
   APPLICATIONS ENDPOINTS (Student & Tutor)
   ========================================================================== */

// 1. POST /applications - Submit application (Student Only, No duplicate)
app.post("/applications", verifyToken, verifyStudent, async (req, res) => {
  try {
    const { tuitionId, studentPhone, preferredSchedule, studentNote } =
      req.body;

    if (!tuitionId || !studentPhone) {
      return res.status(400).json({
        success: false,
        message: "Tuition ID and Student Phone are required.",
      });
    }

    const objectId = toObjectId(tuitionId);
    if (!objectId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Tuition ID" });
    }

    const tuition = await tuitionsCollection.findOne({ _id: objectId });
    if (!tuition) {
      return res
        .status(404)
        .json({ success: false, message: "Tuition not found." });
    }

    if (tuition.approvalStatus !== "approved" || !tuition.isActive) {
      return res.status(400).json({
        success: false,
        message: "This tuition is currently not accepting applications.",
      });
    }

    // Checking the duplicate application
    const existingApp = await applicationsCollection.findOne({
      tuitionId: tuition._id.toString(),
      studentEmail: req.user.email,
    });

    if (existingApp) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this tuition.",
      });
    }

    const newApplication = {
      tuitionId: tuition._id.toString(),
      tuitionTitle: tuition.title,
      subject: tuition.subject,
      monthlyFee: tuition.monthlyFee,
      tutorName: tuition.tutorName,
      tutorEmail: tuition.tutorEmail,
      studentName: req.user.name,
      studentEmail: req.user.email,
      studentPhone: studentPhone.trim(),
      preferredSchedule: preferredSchedule?.trim() || "Flexible",
      studentNote: studentNote?.trim() || "",
      status: "pending", // 'pending' | 'accepted' | 'rejected'
      appliedAt: new Date(),
    };

    const result = await applicationsCollection.insertOne(newApplication);

    res.status(201).json({
      success: true,
      message: "Application submitted successfully!",
      applicationId: result.insertedId,
    });
  } catch (error) {
    console.error("Error submitting application:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit application",
    });
  }
});

// 2. GET /student/my-applications - Student's applied tuitions
app.get(
  "/student/my-applications",
  verifyToken,
  verifyStudent,
  async (req, res) => {
    try {
      const applications = await applicationsCollection
        .find({ studentEmail: req.user.email })
        .sort({ appliedAt: -1 })
        .toArray();

      res.status(200).json({
        success: true,
        applications,
      });
    } catch (error) {
      console.error("Error fetching student applications:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch your applications",
      });
    }
  },
);

// 3. DELETE /applications/:id - Cancel application while still pending (Student Only)
app.delete(
  "/applications/:id",
  verifyToken,
  verifyStudent,
  async (req, res) => {
    try {
      const objectId = toObjectId(req.params.id);
      if (!objectId) {
        return res.status(400).json({ success: false, message: "Invalid ID" });
      }

      const appRecord = await applicationsCollection.findOne({
        _id: objectId,
        studentEmail: req.user.email,
      });

      if (!appRecord) {
        return res.status(404).json({
          success: false,
          message: "Application not found or unauthorized",
        });
      }

      if (appRecord.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Only pending applications can be cancelled.",
        });
      }

      await applicationsCollection.deleteOne({ _id: objectId });

      res.status(200).json({
        success: true,
        message: "Application cancelled successfully",
      });
    } catch (error) {
      console.error("Error cancelling application:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cancel application",
      });
    }
  },
);

// 4. GET /tutor/applicants - Tutor views all students applied to their tuitions
app.get("/tutor/applicants", verifyToken, verifyTutor, async (req, res) => {
  try {
    const applications = await applicationsCollection
      .find({ tutorEmail: req.user.email })
      .sort({ appliedAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error("Error fetching tutor applicants:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applicants",
    });
  }
});

// 5. PATCH /applications/:id/status - Tutor accepts or rejects an application
app.patch(
  "/applications/:id/status",
  verifyToken,
  verifyTutor,
  async (req, res) => {
    try {
      const objectId = toObjectId(req.params.id);
      if (!objectId) {
        return res.status(400).json({ success: false, message: "Invalid ID" });
      }

      const { status } = req.body;
      if (!["accepted", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be either 'accepted' or 'rejected'",
        });
      }

      const result = await applicationsCollection.updateOne(
        { _id: objectId, tutorEmail: req.user.email },
        { $set: { status, updatedAt: new Date() } },
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Application not found or unauthorized.",
        });
      }

      res.status(200).json({
        success: true,
        message: `Application marked as ${status}`,
      });
    } catch (error) {
      console.error("Error updating application status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update application status",
      });
    }
  },
);

/* ==========================================================================
   USERS & PROFILE ENDPOINTS
   ========================================================================== */

// 1. GET /users/me - Current authenticated user profile
app.get("/users/me", verifyToken, async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

// 2. PATCH /users/profile - Update current user profile (Name, phone, bio, image)
app.patch("/users/profile", verifyToken, async (req, res) => {
  try {
    const { name, phone, bio, image } = req.body;
    const objectId = toObjectId(req.user.id);

    const updateFields = {
      ...(name && { name: name.trim() }),
      ...(phone !== undefined && { phone: phone.trim() }),
      ...(bio !== undefined && { bio: bio.trim() }),
      ...(image && { image: image.trim() }),
      updatedAt: new Date(),
    };

    const query = objectId
      ? { $or: [{ _id: objectId }, { _id: req.user.id }] }
      : { _id: req.user.id };

    await usersCollection.updateOne(query, { $set: updateFields });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
});

// 3. GET /admin/users - Admin views all users
app.get("/admin/users", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await usersCollection
      .find({})
      .project({ password: 0 })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Error fetching users for admin:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
});

// 4. PATCH /admin/users/:id/role - Admin updates user role
app.patch(
  "/admin/users/:id/role",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const objectId = toObjectId(req.params.id);
      const { role } = req.body;

      if (!["student", "tutor", "admin"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Role must be 'student', 'tutor', or 'admin'",
        });
      }

      const query = objectId
        ? { $or: [{ _id: objectId }, { _id: req.params.id }] }
        : { _id: req.params.id };

      const result = await usersCollection.updateOne(query, {
        $set: { role, updatedAt: new Date() },
      });

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        message: `User role updated to ${role}`,
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update user role",
      });
    }
  },
);

/* ==========================================================================
   DASHBOARD STATS ENDPOINTS
   ========================================================================== */

// 1. GET /stats/student - Student stats
app.get(
  ["/stats/student", "/student/stats"],
  verifyToken,
  verifyStudent,
  async (req, res) => {
    try {
      const [totalApplied, accepted, pending, rejected] = await Promise.all([
        applicationsCollection.countDocuments({ studentEmail: req.user.email }),
        applicationsCollection.countDocuments({
          studentEmail: req.user.email,
          status: "accepted",
        }),
        applicationsCollection.countDocuments({
          studentEmail: req.user.email,
          status: "pending",
        }),
        applicationsCollection.countDocuments({
          studentEmail: req.user.email,
          status: "rejected",
        }),
      ]);

      res.status(200).json({
        success: true,
        stats: {
          totalApplied,
          accepted,
          pending,
          rejected,
          plan: req.user.plan,
        },
      });
    } catch (error) {
      console.error("Error fetching student stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch student statistics",
      });
    }
  },
);

// 2. GET /stats/tutor - Tutor stats
app.get(
  ["/stats/tutor", "/tutor/stats"],
  verifyToken,
  verifyTutor,
  async (req, res) => {
    try {
      const [totalPosted, activeApproved, totalApplicants] = await Promise.all([
        tuitionsCollection.countDocuments({ tutorEmail: req.user.email }),
        tuitionsCollection.countDocuments({
          tutorEmail: req.user.email,
          approvalStatus: "approved",
          isActive: true,
        }),
        applicationsCollection.countDocuments({ tutorEmail: req.user.email }),
      ]);

      res.status(200).json({
        success: true,
        stats: {
          totalPosted,
          activeApproved,
          totalApplicants,
          plan: req.user.plan,
        },
      });
    } catch (error) {
      console.error("Error fetching tutor stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch tutor statistics",
      });
    }
  },
);

// 3. GET /stats/admin - Admin platform stats
app.get(
  ["/stats/admin", "/admin/stats"],
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const [
        totalUsers,
        totalTutors,
        totalStudents,
        pendingTuitions,
        approvedTuitions,
        totalPayments,
      ] = await Promise.all([
        usersCollection.countDocuments({}),
        usersCollection.countDocuments({ role: "tutor" }),
        usersCollection.countDocuments({ role: "student" }),
        tuitionsCollection.countDocuments({ approvalStatus: "pending" }),
        tuitionsCollection.countDocuments({ approvalStatus: "approved" }),
        paymentsCollection.find({ paymentStatus: "paid" }).toArray(),
      ]);

      const totalRevenue = totalPayments.reduce(
        (sum, p) => sum + (Number(p.amount) || 0),
        0,
      );

      res.status(200).json({
        success: true,
        stats: {
          totalUsers,
          totalTutors,
          totalStudents,
          pendingTuitions,
          approvedTuitions,
          totalRevenue,
        },
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch admin statistics",
      });
    }
  },
);

// 4. GET /admin/transactions - Transaction records for admin
app.get("/admin/transactions", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const transactions = await paymentsCollection
      .find({})
      .sort({ paidAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
    });
  }
});

/* ==========================================================================
   STRIPE PAYMENT & SUBSCRIPTION ENDPOINTS
   ========================================================================== */

// 1. POST /payments/create-checkout-session - Create Stripe checkout session
app.post("/payments/create-checkout-session", verifyToken, async (req, res) => {
  try {
    const { planType } = req.body;

    const isTutor = planType === "tutor_pro" || req.user.role === "tutor";
    const amount = isTutor ? 1500 : 1000; // in cents ($15 or $10)
    const planName = isTutor
      ? "MentorLagbe Tutor Pro Plan"
      : "MentorLagbe Student Pro Plan";
    const planDesc = isTutor
      ? "Unlimited tuition posts, verified mentor badge & priority listing"
      : "Priority tuition applications & unlimited bookmarks";

    const origin =
      req.headers.origin || process.env.CLIENT_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: req.user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: planName,
              description: planDesc,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: req.user.id,
        userEmail: req.user.email,
        userName: req.user.name,
        userRole: req.user.role,
        planType: isTutor ? "tutor_pro" : "student_pro",
      },
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment/cancel`,
    });

    res.status(200).json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create checkout session",
    });
  }
});

// 2. POST /payments/verify-session - Verify payment and upgrade user plan
app.post("/payments/verify-session", verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res
        .status(400)
        .json({ success: false, message: "Session ID is required" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid" && session.status !== "complete") {
      return res.status(400).json({
        success: false,
        message: "Payment has not been completed.",
      });
    }

    // Check if transaction already saved in payments collection
    let existingPayment = await paymentsCollection.findOne({
      stripeSessionId: sessionId,
    });

    if (!existingPayment) {
      const isTutor =
        session.metadata?.planType === "tutor_pro" || req.user.role === "tutor";
      const amountValue = session.amount_total
        ? session.amount_total / 100
        : isTutor
          ? 15
          : 10;

      const paymentRecord = {
        userEmail: session.metadata?.userEmail || req.user.email,
        userName: session.metadata?.userName || req.user.name,
        userRole: session.metadata?.userRole || req.user.role,
        planName: isTutor ? "Tutor Pro ($15)" : "Student Pro ($10)",
        amount: amountValue,
        currency: session.currency?.toUpperCase() || "USD",
        transactionId: session.payment_intent || session.id,
        stripeSessionId: session.id,
        paymentStatus: "paid",
        paidAt: new Date(),
      };

      await paymentsCollection.insertOne(paymentRecord);
      existingPayment = paymentRecord;

      // Update user subscription plan to 'pro' in users collection
      const objectId = toObjectId(req.user.id);
      const query = objectId
        ? {
            $or: [
              { _id: objectId },
              { _id: req.user.id },
              { email: req.user.email },
            ],
          }
        : { email: req.user.email };

      await usersCollection.updateOne(query, {
        $set: { plan: "pro", updatedAt: new Date() },
      });
    }

    res.status(200).json({
      success: true,
      message: "Pro subscription activated successfully!",
      payment: existingPayment,
    });
  } catch (error) {
    console.error("Error verifying payment session:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to verify payment session",
    });
  }
});

/* ==========================================================================
   BOOKMARK / SAVED TUITIONS (Stored inside user document to keep 4 collections)
   ========================================================================== */

// 1. POST /tuitions/:id/bookmark - Bookmark tuition with free/pro limit check
app.post(
  "/tuitions/:id/bookmark",
  verifyToken,
  verifyStudent,
  async (req, res) => {
    try {
      const tuitionId = req.params.id;
      const objectId = toObjectId(req.user.id);
      const query = objectId
        ? { $or: [{ _id: objectId }, { _id: req.user.id }] }
        : { _id: req.user.id };

      const user = await usersCollection.findOne(query);
      const currentBookmarks = Array.isArray(user?.savedTuitionIds)
        ? user.savedTuitionIds
        : [];

      // Already bookmarked? Toggle/remove
      if (currentBookmarks.includes(tuitionId)) {
        await usersCollection.updateOne(query, {
          $pull: { savedTuitionIds: tuitionId },
        });
        return res.status(200).json({
          success: true,
          message: "Tuition removed from saved bookmarks",
          isBookmarked: false,
        });
      }

      // Check free plan limit (max 5 bookmarks)
      if (req.user.plan !== "pro" && currentBookmarks.length >= 5) {
        return res.status(403).json({
          success: false,
          message:
            "Free plan limit reached (max 5 saved tuitions). Upgrade to Pro for unlimited bookmarks.",
        });
      }

      await usersCollection.updateOne(query, {
        $addToSet: { savedTuitionIds: tuitionId },
      });

      res.status(200).json({
        success: true,
        message: "Tuition bookmarked successfully!",
        isBookmarked: true,
      });
    } catch (error) {
      console.error("Error bookmarking tuition:", error);
      res.status(500).json({
        success: false,
        message: "Failed to bookmark tuition",
      });
    }
  },
);

// 2. GET /student/saved-tuitions - Fetch student's bookmarked tuitions
app.get(
  "/student/saved-tuitions",
  verifyToken,
  verifyStudent,
  async (req, res) => {
    try {
      const objectId = toObjectId(req.user.id);
      const query = objectId
        ? { $or: [{ _id: objectId }, { _id: req.user.id }] }
        : { _id: req.user.id };

      const user = await usersCollection.findOne(query);
      const savedIds = Array.isArray(user?.savedTuitionIds)
        ? user.savedTuitionIds
        : [];

      if (savedIds.length === 0) {
        return res.status(200).json({ success: true, tuitions: [] });
      }

      const objectIds = savedIds.map(toObjectId).filter(Boolean);
      const tuitions = await tuitionsCollection
        .find({
          $or: [{ _id: { $in: objectIds } }, { _id: { $in: savedIds } }],
        })
        .toArray();

      res.status(200).json({
        success: true,
        tuitions,
      });
    } catch (error) {
      console.error("Error fetching saved tuitions:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch saved tuitions",
      });
    }
  },
);

const server = http.createServer({ maxHeaderSize: 131072 }, app);

if (process.env.NODE_ENV !== "test") {
  server.listen(port, () => {
    console.log(`MentorLagbe Backend server is running on port ${port} (maxHeaderSize: 128KB)`);
  });
}

export default app;
