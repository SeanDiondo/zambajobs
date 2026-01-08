import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fs from "fs";
import path from "path";
import { 
  hashPassword, 
  comparePassword, 
  generateVerificationToken,
  generateJWT,
  getUserId,
  isAuthenticated,
  isAdmin,
  isEmployer,
  isJobSeeker
} from "./auth";
import {
  sendOTPEmail,
  sendPasswordResetEmail,
  sendApplicationStatusEmail,
  sendFraudAlertEmail,
  generateOTP,
} from "./email";
import {
  analyzeUserProfileForFraud,
  analyzeJobPostingForFraud,
  calculateJobMatch,
  calculateJobMatchWithReasoning,
  findMatchingCandidates,
} from "./ai";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { insertUserSchema, insertJobSchema, insertApplicationSchema, insertContactMessageSchema, users, type User, type JobSeekerProfile } from "@shared/schema";
import { ActivityLogger } from "./logger";
import { createAdminRouter } from "./routes/admin";
import { setupAuth, isAuthenticated as isReplitAuthenticated } from "./replitAuth";
import { setupGoogleAuth } from "./googleAuth";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@zambajobs.com";

// Type predicate to ensure required user fields are present
type UserWithCoreFields = typeof users.$inferSelect & {
  email: string;
  role: 'job_seeker' | 'employer' | 'admin';
  firstName: string;
  lastName: string;
};

function requireUserCoreFields(user: typeof users.$inferSelect | undefined): asserts user is UserWithCoreFields {
  if (!user) {
    throw new Error("User not found");
  }
  if (!user.email) {
    throw new Error("User email is required");
  }
  if (!user.role) {
    throw new Error("User role is required");
  }
  if (!user.firstName) {
    throw new Error("User first name is required");
  }
  if (!user.lastName) {
    throw new Error("User last name is required");
  }
}

// Middleware to prevent caching of authenticated pages
function noCacheMiddleware(req: any, res: any, next: any) {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Add local upload endpoint for development
  app.put("/api/local-upload/*", async (req: any, res) => {
    try {
      const filePath = req.params[0];
      const fullPath = path.join(process.cwd(), "uploads", filePath);
      const dir = path.dirname(fullPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const writeStream = fs.createWriteStream(fullPath);
      req.pipe(writeStream);
      
      writeStream.on("finish", () => {
        res.json({ message: "Upload successful" });
      });
      
      writeStream.on("error", (err) => {
        console.error("Local upload error:", err);
        res.status(500).json({ message: "Upload failed" });
      });
    } catch (error) {
      console.error("Local upload route error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  // Set up Replit Auth (includes session setup)
  await setupAuth(app);
  
  // Set up direct Google OAuth
  await setupGoogleAuth(app);

  // Apply no-cache headers to all API routes to prevent back button showing cached authenticated content
  app.use('/api', noCacheMiddleware);

  // Unified auth endpoint - works with both Replit Auth (session) and legacy (JWT)
  app.get("/api/auth/user", async (req, res) => {
    try {
      // Try Replit Auth session first
      if (req.isAuthenticated?.() && (req.user as any)?.claims?.sub) {
        const userId = (req.user as any).claims.sub;
        const user = await storage.getUser(userId);
        if (user) {
          const { password, ...safeUser } = user;
          return res.json({ ...safeUser, authMode: "replit" });
        }
      }
      
      // Fall back to legacy JWT
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const userId = getUserId(req);
          const user = await storage.getUser(userId);
          if (user) {
            const { password, ...safeUser } = user;
            return res.json({ ...safeUser, authMode: "jwt" });
          }
        } catch (error) {
          // JWT invalid or expired
        }
      }
      
      return res.status(401).json({ message: "Unauthorized" });
    } catch (error: any) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Onboarding completion endpoint (for new Replit Auth users)
  app.post("/api/auth/complete-onboarding", isReplitAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { role } = req.body;
      
      if (!role || !["job_seeker", "employer", "admin"].includes(role)) {
        return res.status(400).json({ message: "Valid role is required" });
      }
      
      // Update user with role
      const user = await storage.updateUser(userId, { role });
      
      // Create appropriate profile
      if (role === "job_seeker") {
        await storage.createJobSeekerProfile({ userId });
      } else if (role === "employer") {
        await storage.createEmployerProfile({ userId, companyName: "" });
      }
      
      const { password, ...safeUser } = user;
      res.json({ user: safeUser });
    } catch (error: any) {
      console.error("Onboarding completion error:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      // Strip out agreeToTerms (frontend validation only, not stored in DB)
      const { agreeToTerms, ...registrationData } = req.body;
      const validatedData = insertUserSchema.parse(registrationData);
      
      if (!validatedData.email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const existingUser = await storage.getUserByEmail(validatedData.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      if (!validatedData.password) {
        return res.status(400).json({ message: "Password is required" });
      }

      const hashedPassword = await hashPassword(validatedData.password);
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Create user with OTP (bypassing schema validation for internal fields)
      const user = await storage.createUser({
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        profileImageUrl: validatedData.profileImageUrl,
        role: validatedData.role,
        otp,
        otpExpiry,
        otpAttempts: 0,
      } as any);

      // Create profile based on role
      if (user.role === "job_seeker") {
        await storage.createJobSeekerProfile({
          userId: user.id,
        });
      } else if (user.role === "employer") {
        await storage.createEmployerProfile({
          userId: user.id,
          companyName: "", // Will be filled in profile setup
        });
      }

      // Send OTP email
      if (!user.email) {
        return res.status(500).json({ message: "User email is missing" });
      }
      await sendOTPEmail(user.email, otp, user.firstName || undefined);

      res.json({ 
        message: "Registration successful. Please check your email for your verification code.",
        email: user.email,
        requiresOTP: true
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({ message: "Email and OTP are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if already verified
      if (user.isEmailVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }

      // Check OTP lockout (5 failed attempts)
      const attempts = user.otpAttempts ?? 0;
      if (attempts >= 5) {
        return res.status(429).json({ message: "Too many failed attempts. Please request a new code." });
      }

      // Check if OTP exists and not expired
      if (!user.otp || !user.otpExpiry) {
        return res.status(400).json({ message: "No verification code found. Please request a new one." });
      }

      if (new Date() > user.otpExpiry) {
        return res.status(400).json({ message: "Verification code expired. Please request a new one." });
      }

      // Verify OTP
      if (user.otp !== otp) {
        await storage.updateUser(user.id, { 
          otpAttempts: attempts + 1 
        });
        return res.status(400).json({ message: "Invalid verification code" });
      }

      // OTP is valid - verify email and clear OTP and rate limiting fields
      await storage.updateUser(user.id, {
        isEmailVerified: true,
        otp: null,
        otpExpiry: null,
        otpAttempts: 0,
        lastOtpResendAt: null,
        otpResendCount: 0,
        otpResendHourStart: null,
      });

      // Set session and generate JWT
      if (!user.email) {
        return res.status(500).json({ message: "User email is missing" });
      }
      
      if (!user.role) {
        return res.status(500).json({ message: "User role is missing" });
      }
      
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.userEmail = user.email;

      const token = generateJWT({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.json({ 
        message: "Email verified successfully",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      });
    } catch (error: any) {
      console.error("OTP verification error:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  app.post("/api/auth/resend-otp", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || !user.email) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if already verified
      if (user.isEmailVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }

      const now = new Date();

      // Rate limit: 1 resend per minute
      if (user.lastOtpResendAt) {
        const timeSinceLastResend = Math.max(0, now.getTime() - user.lastOtpResendAt.getTime());
        if (timeSinceLastResend < 60 * 1000) {
          const secondsRemaining = Math.ceil((60 * 1000 - timeSinceLastResend) / 1000);
          return res.status(429).json({ 
            message: `Please wait ${secondsRemaining} seconds before requesting another code` 
          });
        }
      }

      // Rate limit: 5 resends per hour
      let resendCount = user.otpResendCount ?? 0;
      let hourStart = user.otpResendHourStart;

      // Reset counter if we're in a new hour
      if (!hourStart || now.getTime() - hourStart.getTime() >= 60 * 60 * 1000) {
        resendCount = 0;
        hourStart = now;
      }

      if (resendCount >= 5) {
        const minutesRemaining = Math.ceil((60 * 60 * 1000 - (now.getTime() - hourStart!.getTime())) / (60 * 1000));
        return res.status(429).json({ 
          message: `Too many resend requests. Please try again in ${minutesRemaining} minutes` 
        });
      }

      // Generate new OTP
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.updateUser(user.id, {
        otp,
        otpExpiry,
        otpAttempts: 0,
        lastOtpResendAt: now,
        otpResendCount: resendCount + 1,
        otpResendHourStart: hourStart,
      });

      // Send new OTP
      await sendOTPEmail(user.email, otp, user.firstName || undefined);

      res.json({ message: "New verification code sent to your email" });
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      res.status(500).json({ message: "Failed to resend verification code" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isValid = await comparePassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (!user.isEmailVerified) {
        return res.status(403).json({ message: "Please verify your email before logging in" });
      }

      // Ensure user has core fields for authentication
      requireUserCoreFields(user);

      // Set session for backward compatibility
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.userEmail = user.email;

      // Generate JWT token
      const token = generateJWT({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.json({ 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      
      // Clear the session cookie to ensure complete logout
      // Must match the exact cookie options used when creating the session
      res.clearCookie('connect.sid', {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax'
      });
      
      // Set cache-control headers to prevent browser caching after logout
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, emailVerificationToken, passwordResetToken, ...safeUser } = user;
      res.json(safeUser);
    } catch (error: any) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.json({ message: "If the email exists, a reset link will be sent" });
      }

      const resetToken = generateVerificationToken();
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.updateUser(user.id, {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetExpiry,
      });

      await sendPasswordResetEmail(email, resetToken, user.firstName || undefined);
      
      res.json({ message: "If the email exists, a reset link will be sent" });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Invalid verification link" });
      }

      const user = await storage.getUserByVerificationToken(token);
      
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification link" });
      }

      // Check if token is expired
      if (user.emailVerificationTokenExpiry && user.emailVerificationTokenExpiry < new Date()) {
        return res.status(400).json({ message: "Verification link has expired" });
      }

      // Check if already verified (idempotent)
      if (user.isEmailVerified) {
        return res.json({ message: "Email already verified. You can now log in." });
      }

      // Mark user as verified and clear token
      await storage.updateUser(user.id, {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null,
      });

      res.json({ message: "Email verified successfully! You can now log in." });
    } catch (error: any) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // Job Seeker Profile routes
  app.get("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role === "job_seeker") {
        const profile = await storage.getJobSeekerProfile(user.id);
        const workExp = profile ? await storage.getWorkExperience(profile.id) : [];
        const edu = profile ? await storage.getEducation(profile.id) : [];
        const certs = profile ? await storage.getCertifications(profile.id) : [];
        
        res.json({
          ...profile,
          workExperience: workExp,
          education: edu,
          certifications: certs,
        });
      } else if (user.role === "employer") {
        const profile = await storage.getEmployerProfile(user.id);
        res.json(profile);
      } else {
        res.json({ message: "No profile for this role" });
      }
    } catch (error: any) {
      console.error("Get profile error:", error);
      res.status(500).json({ message: "Failed to get profile" });
    }
  });

  app.put("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role === "job_seeker") {
        const profile = await storage.getJobSeekerProfile(user.id);
        if (!profile) {
          return res.status(404).json({ message: "Profile not found" });
        }

        // Temporary debug logging for resume upload issue
        console.log("Profile update - resumeUrl in body:", req.body.resumeUrl ? "YES" : "NO");
        if (req.body.resumeUrl) {
          console.log("Resume path:", req.body.resumeUrl);
        }

        // Verify and set ACL for profile image if provided
        if (req.body.profileImage) {
          let imagePath = req.body.profileImage;
          
          // Normalize path - remove any traversal attempts
          imagePath = imagePath.replace(/\.\./g, '').replace(/\/+/g, '/');
          
          // Strict validation - must match exact pattern
          const pathRegex = new RegExp(`^/users/${user.id}/profile-\\d+-[a-z0-9]+\\.(jpg|jpeg|png|webp)$`);
          if (!pathRegex.test(imagePath)) {
            return res.status(403).json({ message: "Invalid image path format" });
          }

          // Set ACL policy for uploaded image
          try {
            const objectStorageService = new ObjectStorageService();
            // ACL methods expect paths starting with /objects/
            await objectStorageService.trySetObjectEntityAclPolicy(`/objects${imagePath}`, {
              owner: user.id,
              visibility: "private",
            });
          } catch (error) {
            console.error("Failed to set ACL for profile image:", error);
            // Continue anyway - image is uploaded, just might not be accessible yet
          }
        }

        // Verify and set ACL for resume if provided
        if (req.body.resumeUrl) {
          let resumePath = req.body.resumeUrl;
          
          // Normalize path - remove any traversal attempts
          resumePath = resumePath.replace(/\.\./g, '').replace(/\/+/g, '/');
          
          // Strict validation - must match exact pattern
          const pathRegex = new RegExp(`^/users/${user.id}/resume-\\d+-[a-z0-9]+\\.(pdf|doc|docx)$`);
          if (!pathRegex.test(resumePath)) {
            console.error("Invalid resume path format:", resumePath);
            return res.status(403).json({ message: "Invalid resume path format" });
          }

          // Set ACL policy for uploaded resume
          try {
            const objectStorageService = new ObjectStorageService();
            // ACL methods expect paths starting with /objects/
            await objectStorageService.trySetObjectEntityAclPolicy(`/objects${resumePath}`, {
              owner: user.id,
              visibility: "private",
            });
          } catch (error) {
            console.error("Failed to set ACL for resume:", error);
            // Continue anyway - resume is uploaded, just might not be accessible yet
          }
        }

        const updated = await storage.updateJobSeekerProfile(profile.id, req.body);
        
        // Run fraud detection analysis on profile update
        // Note: Skip image analysis for now (internal paths not accessible to OpenAI API)
        const fraudResult = await analyzeUserProfileForFraud(user, updated, undefined);
        if (fraudResult.isFraudulent && fraudResult.confidence >= 70) {
          await storage.createFraudAlert({
            entityType: "user",
            entityId: user.id,
            alertType: fraudResult.alertType,
            description: fraudResult.reasons.join("; "),
            aiConfidence: fraudResult.confidence,
          });
          await sendFraudAlertEmail(
            fraudResult.alertType,
            fraudResult.reasons.join("; "),
            "user",
            user.id,
            fraudResult.confidence
          );
        }
        
        res.json(updated);
      } else if (user.role === "employer") {
        const profile = await storage.getEmployerProfile(user.id);
        if (!profile) {
          return res.status(404).json({ message: "Profile not found" });
        }

        const updated = await storage.updateEmployerProfile(profile.id, req.body);
        res.json(updated);
      }
    } catch (error: any) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Work Experience routes
  app.post("/api/profile/work-experience", isAuthenticated, isJobSeeker, async (req, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getJobSeekerProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      const workExp = await storage.createWorkExperience({
        ...req.body,
        profileId: profile.id,
      });
      res.json(workExp);
    } catch (error: any) {
      console.error("Create work experience error:", error);
      res.status(500).json({ message: "Failed to create work experience" });
    }
  });

  app.delete("/api/profile/work-experience/:id", isAuthenticated, isJobSeeker, async (req, res) => {
    try {
      await storage.deleteWorkExperience(req.params.id);
      res.json({ message: "Work experience deleted" });
    } catch (error: any) {
      console.error("Delete work experience error:", error);
      res.status(500).json({ message: "Failed to delete work experience" });
    }
  });

  // Education routes
  app.post("/api/profile/education", isAuthenticated, isJobSeeker, async (req, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getJobSeekerProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      const education = await storage.createEducation({
        ...req.body,
        profileId: profile.id,
      });
      res.json(education);
    } catch (error: any) {
      console.error("Create education error:", error);
      res.status(500).json({ message: "Failed to create education" });
    }
  });

  app.delete("/api/profile/education/:id", isAuthenticated, isJobSeeker, async (req, res) => {
    try {
      await storage.deleteEducation(req.params.id);
      res.json({ message: "Education deleted" });
    } catch (error: any) {
      console.error("Delete education error:", error);
      res.status(500).json({ message: "Failed to delete education" });
    }
  });

  // Certifications routes
  app.post("/api/profile/certifications", isAuthenticated, isJobSeeker, async (req, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getJobSeekerProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      const certification = await storage.createCertification({
        ...req.body,
        profileId: profile.id,
      });
      res.json(certification);
    } catch (error: any) {
      console.error("Create certification error:", error);
      res.status(500).json({ message: "Failed to create certification" });
    }
  });

  app.delete("/api/profile/certifications/:id", isAuthenticated, isJobSeeker, async (req, res) => {
    try {
      await storage.deleteCertification(req.params.id);
      res.json({ message: "Certification deleted" });
    } catch (error: any) {
      console.error("Delete certification error:", error);
      res.status(500).json({ message: "Failed to delete certification" });
    }
  });

  // Jobs routes
  app.get("/api/jobs", async (req, res) => {
    try {
      const { search, location, jobType, category } = req.query;
      
      const jobs = await storage.getAllJobs({ isActive: true });
      let filteredJobs = jobs.filter(j => !j.isFlagged);
      
      // Apply search filter (search in title and description)
      if (search && typeof search === 'string' && search.trim() !== '') {
        const searchLower = search.toLowerCase().trim();
        filteredJobs = filteredJobs.filter(job => 
          job.title?.toLowerCase().includes(searchLower) ||
          job.description?.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply location filter
      if (location && typeof location === 'string' && location.trim() !== '') {
        const locationLower = location.toLowerCase().trim();
        filteredJobs = filteredJobs.filter(job => 
          job.location?.toLowerCase().includes(locationLower)
        );
      }
      
      // Apply job type filter
      if (jobType && typeof jobType === 'string' && jobType !== 'all') {
        filteredJobs = filteredJobs.filter(job => 
          job.jobType === jobType
        );
      }
      
      // Apply category filter
      if (category && typeof category === 'string' && category !== 'all') {
        filteredJobs = filteredJobs.filter(job => 
          job.category === category
        );
      }
      
      res.json(filteredJobs);
    } catch (error: any) {
      console.error("Get jobs error:", error);
      res.status(500).json({ message: "Failed to get jobs" });
    }
  });

  // IMPORTANT: Specific routes must come before dynamic :id routes
  app.get("/api/jobs/recommended", isAuthenticated, isJobSeeker, async (req, res) => {
    try {
      const profile = await storage.getJobSeekerProfile(getUserId(req));
      if (!profile) {
        return res.json([]);
      }

      // Fetch complete profile data for enhanced matching (only once per request)
      const [workExp, education, certifications] = await Promise.all([
        storage.getWorkExperience(profile.id),
        storage.getEducation(profile.id),
        storage.getCertifications(profile.id)
      ]);

      const allJobs = await storage.getAllJobs({ isActive: true });
      const activeJobs = allJobs.filter(j => !j.isFlagged);
      
      // Prepare profile data once for all comparisons
      const workExpData = workExp.map(w => ({ 
        companyName: w.companyName, 
        position: w.position, 
        description: w.description || undefined 
      }));
      const educationData = education.map(e => ({ 
        institution: e.institution, 
        degree: e.degree, 
        fieldOfStudy: e.fieldOfStudy || undefined 
      }));
      const certData = certifications.map(c => ({ 
        name: c.name, 
        issuer: c.issuer 
      }));
      
      // Process ALL jobs with concurrency limit for API calls (batch of 5)
      const BATCH_SIZE = 5;
      const jobsWithScores: Array<any> = [];
      
      for (let i = 0; i < activeJobs.length; i += BATCH_SIZE) {
        const batch = activeJobs.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async (job) => {
            const result = await calculateJobMatchWithReasoning(
              profile, 
              job,
              workExpData,
              educationData,
              certData
            );
            return { 
              ...job, 
              aiMatchScore: result.matchScore,
              aiMatchReasoning: result.reasoning
            };
          })
        );
        jobsWithScores.push(...batchResults);
      }

      // Return ALL jobs that meet minimum threshold (30+), sorted by score
      const recommended = jobsWithScores
        .filter(j => j.aiMatchScore >= 30)
        .sort((a, b) => b.aiMatchScore - a.aiMatchScore);

      res.json(recommended);
    } catch (error: any) {
      console.error("Get recommended jobs error:", error);
      res.status(500).json({ message: "Failed to get recommended jobs" });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error: any) {
      console.error("Get job error:", error);
      res.status(500).json({ message: "Failed to get job" });
    }
  });

  app.post("/api/jobs", isAuthenticated, isEmployer, async (req, res) => {
    try {
      const validatedData = insertJobSchema.parse(req.body);
      const jobData = {
        ...validatedData,
        employerId: getUserId(req),
        salaryCurrency: "PHP", // Default to Philippine Peso
      };
      const job = await storage.createJob(jobData);

      // Run fraud detection on new job posting
      const fraudResult = await analyzeJobPostingForFraud(job);
      if (fraudResult.isFraudulent && fraudResult.confidence >= 70) {
        await storage.updateJob(job.id, { isFlagged: true });
        await storage.createFraudAlert({
          entityType: "job",
          entityId: job.id,
          alertType: fraudResult.alertType,
          description: fraudResult.reasons.join("; "),
          aiConfidence: fraudResult.confidence,
        });
        await sendFraudAlertEmail(
          fraudResult.alertType,
          fraudResult.reasons.join("; "),
          "job",
          job.id,
          fraudResult.confidence
        );
      }

      res.json(job);
    } catch (error: any) {
      console.error("Create job error:", error);
      res.status(400).json({ message: error.message || "Failed to create job" });
    }
  });

  app.put("/api/jobs/:id", isAuthenticated, isEmployer, async (req, res) => {
    try {
      // Verify the job exists and belongs to this employer
      const existingJob = await storage.getJob(req.params.id);
      if (!existingJob) {
        return res.status(404).json({ message: "Job not found" });
      }
      if (existingJob.employerId !== getUserId(req)) {
        return res.status(403).json({ message: "Unauthorized: You can only edit your own jobs" });
      }

      // Validate and update the job
      const validatedData = insertJobSchema.partial().parse(req.body);
      const updatedJob = await storage.updateJob(req.params.id, validatedData);

      // Run fraud detection on updated job posting
      const fraudResult = await analyzeJobPostingForFraud(updatedJob);
      if (fraudResult.isFraudulent && fraudResult.confidence >= 70) {
        await storage.updateJob(updatedJob.id, { isFlagged: true });
        await storage.createFraudAlert({
          entityType: "job",
          entityId: updatedJob.id,
          alertType: fraudResult.alertType,
          description: fraudResult.reasons.join("; "),
          aiConfidence: fraudResult.confidence,
        });
        await sendFraudAlertEmail(
          fraudResult.alertType,
          fraudResult.reasons.join("; "),
          "job",
          updatedJob.id,
          fraudResult.confidence
        );
      }

      res.json(updatedJob);
    } catch (error: any) {
      console.error("Update job error:", error);
      res.status(400).json({ message: error.message || "Failed to update job" });
    }
  });

  app.delete("/api/jobs/:id", isAuthenticated, isEmployer, async (req, res) => {
    try {
      // Verify the job exists and belongs to this employer
      const existingJob = await storage.getJob(req.params.id);
      if (!existingJob) {
        return res.status(404).json({ message: "Job not found" });
      }
      if (existingJob.employerId !== getUserId(req)) {
        return res.status(403).json({ message: "Unauthorized: You can only delete your own jobs" });
      }

      await storage.deleteJob(req.params.id);
      res.json({ message: "Job deleted successfully" });
    } catch (error: any) {
      console.error("Delete job error:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Admin delete job (no ownership check)
  app.delete("/api/admin/jobs/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const existingJob = await storage.getJob(req.params.id);
      if (!existingJob) {
        return res.status(404).json({ message: "Job not found" });
      }

      await storage.deleteJob(req.params.id);
      res.json({ message: "Job deleted successfully" });
    } catch (error: any) {
      console.error("Admin delete job error:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Applications routes
  app.get("/api/applications", isAuthenticated, async (req, res) => {
    try {
      const applications = await storage.getApplicationsBySeeker(getUserId(req));
      res.json(applications);
    } catch (error: any) {
      console.error("Get applications error:", error);
      res.status(500).json({ message: "Failed to get applications" });
    }
  });

  app.post("/api/jobs/:id/apply", isAuthenticated, isJobSeeker, async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      const profile = await storage.getJobSeekerProfile(getUserId(req));
      if (!profile) {
        return res.status(400).json({ message: "Please complete your profile before applying" });
      }

      // Defensive backend check: Require resume to be uploaded
      if (!profile.resumeUrl) {
        return res.status(400).json({ message: "Please upload your resume before applying" });
      }

      // Fetch complete profile data for enhanced matching
      const workExp = await storage.getWorkExperience(profile.id);
      const education = await storage.getEducation(profile.id);
      const certifications = await storage.getCertifications(profile.id);

      // Calculate match score with complete profile data
      const matchScore = await calculateJobMatch(
        profile,
        job,
        workExp.map(w => ({ companyName: w.companyName, position: w.position, description: w.description || undefined })),
        education.map(e => ({ institution: e.institution, degree: e.degree, fieldOfStudy: e.fieldOfStudy || undefined })),
        certifications.map(c => ({ name: c.name, issuer: c.issuer }))
      );

      // Create application with AI match score (bypassing schema validation for internal fields)
      const application = await storage.createApplication({
        jobId: req.params.id,
        seekerId: getUserId(req),
        coverLetter: req.body.coverLetter || null,
        aiMatchScore: matchScore,
      } as any);

      res.json(application);
    } catch (error: any) {
      console.error("Apply error:", error);
      res.status(400).json({ message: error.message || "Failed to apply" });
    }
  });

  // Employer routes
  app.get("/api/employer/jobs", isAuthenticated, isEmployer, async (req, res) => {
    try {
      const jobs = await storage.getJobsByEmployer(getUserId(req));
      res.json(jobs);
    } catch (error: any) {
      console.error("Get employer jobs error:", error);
      res.status(500).json({ message: "Failed to get jobs" });
    }
  });

  app.get("/api/employer/jobs/:id/applications", isAuthenticated, isEmployer, async (req, res) => {
    try {
      // Verify the job belongs to this employer
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      if (job.employerId !== getUserId(req)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const applications = await storage.getApplicationsByJob(req.params.id);
      
      // Enrich applications with user, profile, and portfolio data
      const enrichedApplications = await Promise.all(
        applications.map(async (app) => {
          const user = await storage.getUser(app.seekerId);
          const profile = await storage.getJobSeekerProfile(app.seekerId);
          
          // Fetch work experience and education
          const workExperience = profile ? await storage.getWorkExperience(profile.id) : [];
          const education = profile ? await storage.getEducation(profile.id) : [];
          
          return {
            ...app,
            applicant: {
              id: user?.id,
              firstName: user?.firstName,
              lastName: user?.lastName,
              email: user?.email,
              profileImage: user?.profileImageUrl || profile?.profileImage,
              headline: profile?.headline,
              location: profile?.location,
              phoneNumber: profile?.phoneNumber,
              resumeUrl: profile?.resumeUrl,
              skills: profile?.skills,
              workExperience,
              education,
            }
          };
        })
      );
      
      res.json(enrichedApplications);
    } catch (error: any) {
      console.error("Get job applications error:", error);
      res.status(500).json({ message: "Failed to get applications" });
    }
  });

  // Get job seeker portfolio for employer to view
  app.get("/api/employer/applicant/:userId", isAuthenticated, isEmployer, async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get user basic info
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'job_seeker') {
        return res.status(404).json({ message: "Job seeker not found" });
      }
      
      // Get profile
      const profile = await storage.getJobSeekerProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      // Get work experience, education, and certifications
      const [workExperience, education, certifications] = await Promise.all([
        storage.getWorkExperience(profile.id),
        storage.getEducation(profile.id),
        storage.getCertifications(profile.id)
      ]);
      
      // Return comprehensive portfolio
      res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImage: user.profileImageUrl || profile.profileImage,
        headline: profile.headline,
        bio: profile.bio,
        location: profile.location,
        phoneNumber: profile.phoneNumber,
        linkedinUrl: profile.linkedinUrl,
        portfolioUrl: profile.portfolioUrl,
        resumeUrl: profile.resumeUrl,
        skills: profile.skills || [],
        workExperience,
        education,
        certifications
      });
    } catch (error: any) {
      console.error("Get applicant portfolio error:", error);
      res.status(500).json({ message: "Failed to fetch applicant portfolio" });
    }
  });

  // Update application status (employer only)
  app.put("/api/applications/:id", isAuthenticated, isEmployer, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Validate status
      const validStatuses = ["applied", "reviewing", "shortlisted", "rejected", "accepted"];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      // Get the application
      const application = await storage.getApplication(id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Verify the job belongs to this employer
      const job = await storage.getJob(application.jobId);
      if (!job || job.employerId !== getUserId(req)) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Update application status
      const updatedApplication = await storage.updateApplication(id, { status });
      res.json(updatedApplication);
    } catch (error: any) {
      console.error("Update application status error:", error);
      res.status(500).json({ message: "Failed to update application status" });
    }
  });

  app.get("/api/employer/candidates", isAuthenticated, isEmployer, async (req, res) => {
    try {
      const employerId = getUserId(req);
      const jobs = await storage.getJobsByEmployer(employerId);
      
      // Only process active jobs
      const activeJobs = jobs.filter(j => j.isActive && !j.isFlagged);
      
      if (activeJobs.length === 0) {
        return res.json([]);
      }

      // Get all job seekers with their complete profiles
      const allUsers = await storage.getAllUsers();
      const jobSeekers = allUsers.filter(u => u.role === "job_seeker");
      
      // Build candidate data with profiles
      const candidatesData = await Promise.all(
        jobSeekers.map(async (user) => {
          const profile = await storage.getJobSeekerProfile(user.id);
          if (!profile) return null;
          
          const workExperience = await storage.getWorkExperience(profile.id);
          const education = await storage.getEducation(profile.id);
          const certifications = await storage.getCertifications(profile.id);
          
          return {
            user,
            profile,
            workExperience,
            education,
            certifications
          };
        })
      );
      
      const validCandidates = candidatesData.filter(Boolean) as Array<{
        user: User;
        profile: JobSeekerProfile;
        workExperience: any[];
        education: any[];
        certifications: any[];
      }>;

      // Find matches for all jobs
      const allMatches = await Promise.all(
        activeJobs.map(async (job) => {
          const matches = await findMatchingCandidates(job, validCandidates);
          return matches.map(m => ({ ...m, jobId: job.id, jobTitle: job.title }));
        })
      );

      // Flatten and deduplicate by userId, keeping highest match score
      const candidateMap = new Map<string, any>();
      allMatches.flat().forEach(match => {
        const existing = candidateMap.get(match.userId);
        if (!existing || match.matchScore > existing.matchScore) {
          candidateMap.set(match.userId, match);
        }
      });

      // Build response with user details
      const recommendations = await Promise.all(
        Array.from(candidateMap.values()).map(async (match) => {
          const user = validCandidates.find(c => c.user.id === match.userId)?.user;
          const profile = validCandidates.find(c => c.user.id === match.userId)?.profile;
          
          if (!user || !profile) return null;
          
          return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            headline: profile.headline,
            matchScore: Math.round(match.matchScore),
            jobId: match.jobId,
            jobTitle: match.jobTitle
          };
        })
      );

      const validRecommendations = recommendations.filter(Boolean);
      res.json(validRecommendations);
    } catch (error: any) {
      console.error("Get candidates error:", error);
      res.status(500).json({ message: "Failed to get candidates" });
    }
  });

  // Admin routes
  app.get("/api/admin/fraud-alerts", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const alerts = await storage.getAllFraudAlerts();
      
      // Enrich alerts with entity and reviewer information
      const enrichedAlerts = await Promise.all(
        alerts.map(async (alert) => {
          let entityInfo = null;
          
          // Get entity information based on type
          if (alert.entityType === 'user') {
            const user = await storage.getUser(alert.entityId);
            if (user) {
              entityInfo = {
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                role: user.role
              };
            }
          } else if (alert.entityType === 'job') {
            const job = await storage.getJob(alert.entityId);
            if (job) {
              const employer = await storage.getUser(job.employerId);
              const employerProfile = await storage.getEmployerProfile(job.employerId);
              entityInfo = {
                title: job.title,
                company: job.companyName || employerProfile?.companyName || 'Unknown',
                employerName: employer ? `${employer.firstName} ${employer.lastName}` : 'Unknown'
              };
            }
          }
          
          // Get reviewer information
          let reviewerInfo = null;
          if (alert.reviewedBy) {
            const reviewer = await storage.getUser(alert.reviewedBy);
            if (reviewer) {
              reviewerInfo = {
                name: `${reviewer.firstName} ${reviewer.lastName}`,
                email: reviewer.email
              };
            }
          }
          
          return {
            ...alert,
            entityInfo,
            reviewerInfo
          };
        })
      );
      
      res.json(enrichedAlerts);
    } catch (error: any) {
      console.error("Get fraud alerts error:", error);
      res.status(500).json({ message: "Failed to get fraud alerts" });
    }
  });

  app.get("/api/admin/fraud-alerts/:id/details", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const alert = await storage.getFraudAlert(req.params.id);
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }

      let details = null;
      if (alert.entityType === 'user') {
        details = await storage.getUser(alert.entityId);
        if (details) {
          const { password, ...safeUser } = details as any;
          details = safeUser;
        }
      } else if (alert.entityType === 'job') {
        details = await storage.getJob(alert.entityId);
      }

      res.json({ alert, details });
    } catch (error: any) {
      console.error("Get fraud alert details error:", error);
      res.status(500).json({ message: "Failed to get fraud alert details" });
    }
  });

  app.put("/api/admin/fraud-alerts/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { status, reviewNotes } = req.body;
      const updated = await storage.updateFraudAlert(req.params.id, {
        status,
        reviewNotes,
        reviewedBy: getUserId(req),
        reviewedAt: new Date(),
      });
      res.json(updated);
    } catch (error: any) {
      console.error("Update fraud alert error:", error);
      res.status(500).json({ message: "Failed to update fraud alert" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const usersWithStats = await storage.getUsersWithStats();
      res.json(usersWithStats);
    } catch (error: any) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.put("/api/admin/users/:id/flag", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { isFlagged } = req.body;
      const updated = await storage.updateUser(req.params.id, { isFlagged });
      res.json(updated);
    } catch (error: any) {
      console.error("Flag user error:", error);
      res.status(500).json({ message: "Failed to flag user" });
    }
  });

  // Admin jobs endpoint with fraud alert information
  app.get("/api/admin/jobs", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const jobs = await storage.getAllJobs();
      const fraudAlerts = await storage.getAllFraudAlerts();
      const employers = await storage.getAllUsers();
      
      // Get employer profiles for company names
      const employerProfilesPromises = employers
        .filter(e => e.role === 'employer')
        .map(e => storage.getEmployerProfile(e.id));
      const employerProfiles = await Promise.all(employerProfilesPromises);
      
      // Enrich jobs with employer info and fraud alert details
      const jobsWithDetails = jobs.map(job => {
        const employer = employers.find(e => e.id === job.employerId);
        const employerProfile = employerProfiles.find(p => p?.userId === job.employerId);
        
        // Use job's companyName if exists, then employer profile companyName, then employer name as fallback
        const companyName = (job as any).companyName 
          || employerProfile?.companyName 
          || (employer?.firstName && employer?.lastName ? `${employer.firstName} ${employer.lastName}` : 'Unknown Employer');
        
        const jobData: any = {
          ...job,
          companyName,
        };
        
        // Add fraud alert info for flagged jobs
        if (job.isFlagged) {
          const jobAlerts = fraudAlerts.filter(
            alert => alert.entityType === 'job' && alert.entityId === job.id
          );
          if (jobAlerts.length > 0) {
            const latestAlert = jobAlerts.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0];
            jobData.fraudAlertReason = latestAlert.description;
            jobData.fraudAlertType = latestAlert.alertType;
            jobData.fraudAlertConfidence = latestAlert.aiConfidence;
            jobData.fraudAlertStatus = latestAlert.status;
          } else {
            // Manual flag - no AI alert exists
            jobData.fraudAlertReason = "Manually flagged by administrator";
            jobData.fraudAlertType = "Manual Review";
            jobData.fraudAlertConfidence = null;
            jobData.fraudAlertStatus = "manual";
          }
        }
        
        return jobData;
      });
      
      res.json(jobsWithDetails);
    } catch (error: any) {
      console.error("Get admin jobs error:", error);
      res.status(500).json({ message: "Failed to get jobs" });
    }
  });

  // Admin flag job endpoint
  app.put("/api/admin/jobs/:id/flag", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { isFlagged } = req.body;
      const updated = await storage.updateJob(req.params.id, { isFlagged });
      res.json(updated);
    } catch (error: any) {
      console.error("Flag job error:", error);
      res.status(500).json({ message: "Failed to flag job" });
    }
  });

  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const jobs = await storage.getAllJobs();
      const applications = await storage.getAllApplications();
      const pendingAlerts = await storage.getPendingFraudAlerts();
      const allAlerts = await storage.getAllFraudAlerts();
      
      // Calculate detailed statistics
      const jobSeekers = users.filter(u => u.role === 'job_seeker').length;
      const employers = users.filter(u => u.role === 'employer').length;
      const flaggedUsers = users.filter(u => u.isFlagged).length;
      const verifiedUsers = users.filter(u => u.isEmailVerified).length;
      
      const activeJobs = jobs.filter(j => j.isActive && !j.isFlagged).length;
      const flaggedJobs = jobs.filter(j => j.isFlagged).length;
      
      const pendingApplications = applications.filter(a => a.status === 'applied').length;
      const confirmedFraudAlerts = allAlerts.filter(a => a.status === 'confirmed').length;
      
      res.json({
        totalUsers: users.length,
        jobSeekers,
        employers,
        flaggedUsers,
        verifiedUsers,
        activeJobs,
        flaggedJobs,
        totalApplications: applications.length,
        pendingApplications,
        pendingFraudAlerts: pendingAlerts.length,
        confirmedFraudAlerts,
        flaggedContent: flaggedJobs + flaggedUsers,
      });
    } catch (error: any) {
      console.error("Get stats error:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/admin", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const jobs = await storage.getAllJobs();
      const applications = await storage.getAllApplications();
      const fraudAlerts = await storage.getAllFraudAlerts();

      // Time-series data for graphs (last 30 days)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // Group users by registration date
      const usersByDate = new Map<string, number>();
      users.forEach(user => {
        if (user.createdAt) {
          const date = new Date(user.createdAt).toISOString().split('T')[0];
          usersByDate.set(date, (usersByDate.get(date) || 0) + 1);
        }
      });

      // Group jobs by posting date
      const jobsByDate = new Map<string, number>();
      jobs.forEach(job => {
        if (job.createdAt) {
          const date = new Date(job.createdAt).toISOString().split('T')[0];
          jobsByDate.set(date, (jobsByDate.get(date) || 0) + 1);
        }
      });

      // Group applications by date
      const applicationsByDate = new Map<string, number>();
      applications.forEach(app => {
        if (app.createdAt) {
          const date = new Date(app.createdAt).toISOString().split('T')[0];
          applicationsByDate.set(date, (applicationsByDate.get(date) || 0) + 1);
        }
      });

      // Generate last 30 days array
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        return date.toISOString().split('T')[0];
      }).reverse();

      const userTrend = last30Days.map(date => ({
        date,
        count: usersByDate.get(date) || 0
      }));

      const jobTrend = last30Days.map(date => ({
        date,
        count: jobsByDate.get(date) || 0
      }));

      const applicationTrend = last30Days.map(date => ({
        date,
        count: applicationsByDate.get(date) || 0
      }));

      // User breakdown by role
      const usersByRole = {
        job_seeker: users.filter(u => u.role === 'job_seeker').length,
        employer: users.filter(u => u.role === 'employer').length,
        admin: users.filter(u => u.role === 'admin').length
      };

      // Application status breakdown
      const applicationsByStatus = {
        applied: applications.filter(a => a.status === 'applied').length,
        reviewing: applications.filter(a => a.status === 'reviewing').length,
        shortlisted: applications.filter(a => a.status === 'shortlisted').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
        accepted: applications.filter(a => a.status === 'accepted').length
      };

      // Fraud alerts breakdown
      const fraudAlertsByStatus = {
        pending: fraudAlerts.filter(a => a.status === 'pending').length,
        reviewed: fraudAlerts.filter(a => a.status === 'reviewed').length,
        confirmed: fraudAlerts.filter(a => a.status === 'confirmed').length,
        dismissed: fraudAlerts.filter(a => a.status === 'dismissed').length
      };

      // Top job categories
      const jobsByCategory = new Map<string, number>();
      jobs.forEach(job => {
        if (job.category) {
          jobsByCategory.set(job.category, (jobsByCategory.get(job.category) || 0) + 1);
        }
      });

      const topCategories = Array.from(jobsByCategory.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      res.json({
        overview: {
          totalUsers: users.length,
          totalJobs: jobs.length,
          totalApplications: applications.length,
          totalFraudAlerts: fraudAlerts.length,
          activeJobs: jobs.filter(j => j.isActive).length,
          flaggedUsers: users.filter(u => u.isFlagged).length,
          verifiedUsers: users.filter(u => u.isEmailVerified).length
        },
        trends: {
          users: userTrend,
          jobs: jobTrend,
          applications: applicationTrend
        },
        breakdown: {
          usersByRole,
          applicationsByStatus,
          fraudAlertsByStatus,
          topCategories
        }
      });
    } catch (error: any) {
      console.error("Get admin analytics error:", error);
      res.status(500).json({ message: "Failed to get analytics" });
    }
  });

  app.get("/api/analytics/employer", isAuthenticated, isEmployer, async (req, res) => {
    try {
      const employerId = getUserId(req);
      if (!employerId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const jobs = await storage.getJobsByEmployer(employerId);
      const allApplications = await storage.getAllApplications();
      
      // Filter applications for THIS employer's jobs only
      const jobIds = new Set(jobs.map(j => j.id));
      const applications = allApplications.filter(a => jobIds.has(a.jobId));

      // Applications over time (last 30 days)
      const now = new Date();
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        return date.toISOString().split('T')[0];
      }).reverse();

      const applicationsByDate = new Map<string, number>();
      applications.forEach(app => {
        if (app.createdAt) {
          const date = new Date(app.createdAt).toISOString().split('T')[0];
          applicationsByDate.set(date, (applicationsByDate.get(date) || 0) + 1);
        }
      });

      const applicationTrend = last30Days.map(date => ({
        date,
        count: applicationsByDate.get(date) || 0
      }));

      // Applications per job
      const applicationsByJob = jobs.map(job => {
        const jobApps = applications.filter(a => a.jobId === job.id);
        return {
          jobTitle: job.title,
          count: jobApps.length,
          avgMatchScore: jobApps.length > 0 
            ? Math.round(jobApps.reduce((sum, a) => sum + (a.aiMatchScore || 0), 0) / jobApps.length)
            : 0
        };
      }).sort((a, b) => b.count - a.count);

      // Application status breakdown
      const applicationsByStatus = {
        applied: applications.filter(a => a.status === 'applied').length,
        reviewing: applications.filter(a => a.status === 'reviewing').length,
        shortlisted: applications.filter(a => a.status === 'shortlisted').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
        accepted: applications.filter(a => a.status === 'accepted').length
      };

      // Match score distribution
      const matchScoreRanges = {
        '90-100': applications.filter(a => a.aiMatchScore && a.aiMatchScore >= 90).length,
        '70-89': applications.filter(a => a.aiMatchScore && a.aiMatchScore >= 70 && a.aiMatchScore < 90).length,
        '50-69': applications.filter(a => a.aiMatchScore && a.aiMatchScore >= 50 && a.aiMatchScore < 70).length,
        'Below 50': applications.filter(a => a.aiMatchScore && a.aiMatchScore < 50).length
      };

      res.json({
        overview: {
          totalJobs: jobs.length,
          activeJobs: jobs.filter(j => j.isActive).length,
          totalApplications: applications.length,
          avgMatchScore: applications.length > 0
            ? Math.round(applications.reduce((sum, a) => sum + (a.aiMatchScore || 0), 0) / applications.length)
            : 0
        },
        trends: {
          applications: applicationTrend
        },
        breakdown: {
          applicationsByJob: applicationsByJob.slice(0, 10),
          applicationsByStatus,
          matchScoreRanges
        }
      });
    } catch (error: any) {
      console.error("Get employer analytics error:", error);
      res.status(500).json({ message: "Failed to get analytics" });
    }
  });

  app.get("/api/analytics/job-seeker", isAuthenticated, isJobSeeker, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const profile = await storage.getJobSeekerProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // Get applications for THIS job seeker only
      const applications = await storage.getApplicationsBySeeker(profile.id);

      // Applications over time (last 30 days)
      const now = new Date();
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        return date.toISOString().split('T')[0];
      }).reverse();

      const applicationsByDate = new Map<string, number>();
      applications.forEach((app: typeof applications[0]) => {
        if (app.createdAt) {
          const date = new Date(app.createdAt).toISOString().split('T')[0];
          applicationsByDate.set(date, (applicationsByDate.get(date) || 0) + 1);
        }
      });

      const applicationTrend = last30Days.map(date => ({
        date,
        count: applicationsByDate.get(date) || 0
      }));

      // Application status breakdown
      const applicationsByStatus = {
        applied: applications.filter((a: typeof applications[0]) => a.status === 'applied').length,
        reviewing: applications.filter((a: typeof applications[0]) => a.status === 'reviewing').length,
        shortlisted: applications.filter((a: typeof applications[0]) => a.status === 'shortlisted').length,
        rejected: applications.filter((a: typeof applications[0]) => a.status === 'rejected').length,
        accepted: applications.filter((a: typeof applications[0]) => a.status === 'accepted').length
      };

      // Match score distribution
      const matchScoreRanges = {
        '90-100': applications.filter((a: typeof applications[0]) => a.aiMatchScore && a.aiMatchScore >= 90).length,
        '70-89': applications.filter((a: typeof applications[0]) => a.aiMatchScore && a.aiMatchScore >= 70 && a.aiMatchScore < 90).length,
        '50-69': applications.filter((a: typeof applications[0]) => a.aiMatchScore && a.aiMatchScore >= 50 && a.aiMatchScore < 70).length,
        'Below 50': applications.filter((a: typeof applications[0]) => a.aiMatchScore && a.aiMatchScore < 50).length
      };

      // Get job details for top applications
      const jobsPromises = applications
        .sort((a: typeof applications[0], b: typeof applications[0]) => (b.aiMatchScore || 0) - (a.aiMatchScore || 0))
        .slice(0, 10)
        .map(async (app: typeof applications[0]) => {
          const job = await storage.getJob(app.jobId);
          let companyName = 'Unknown';
          if (job?.employerId) {
            const employer = await storage.getEmployerProfile(job.employerId);
            companyName = employer?.companyName || 'Unknown';
          }
          return {
            jobTitle: job?.title || 'Unknown',
            company: companyName,
            matchScore: Math.round(app.aiMatchScore || 0),
            status: app.status,
            appliedAt: app.createdAt
          };
        });

      const topApplications = await Promise.all(jobsPromises);

      res.json({
        overview: {
          totalApplications: applications.length,
          avgMatchScore: applications.length > 0
            ? Math.round(applications.reduce((sum: number, a: typeof applications[0]) => sum + (a.aiMatchScore || 0), 0) / applications.length)
            : 0,
          responseRate: applications.length > 0
            ? Math.round((applications.filter((a: typeof applications[0]) => a.status !== 'applied').length / applications.length) * 100)
            : 0
        },
        trends: {
          applications: applicationTrend
        },
        breakdown: {
          applicationsByStatus,
          matchScoreRanges,
          topApplications
        }
      });
    } catch (error: any) {
      console.error("Get job seeker analytics error:", error);
      res.status(500).json({ message: "Failed to get analytics" });
    }
  });

  // Mount admin router for activity logs, contacts, and search
  const adminRouter = createAdminRouter();
  app.use("/api/admin", isAuthenticated, isAdmin, adminRouter);

  // Public contact form submission endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      const validated = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(validated);
      
      // Log the contact message submission
      await ActivityLogger.logSystemEvent(
        `New contact message from ${validated.email}`,
        { messageId: message.id, subject: validated.subject }
      );
      
      res.status(201).json({ message: "Message sent successfully" });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Contact form error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Object Storage routes - Secure user-scoped uploads
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Validate file metadata from request
      const { contentType, fileSize } = req.body;
      
      // Enforce file constraints
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      
      if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
        return res.status(400).json({ message: "Invalid file type. Only JPEG, PNG, and WebP images allowed." });
      }
      
      if (!fileSize || fileSize > MAX_FILE_SIZE) {
        return res.status(400).json({ message: `File size must be under ${MAX_FILE_SIZE / 1024 / 1024}MB` });
      }

      // Generate user-scoped path - server-controlled to prevent traversal
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const extension = contentType.split('/')[1].replace(/[^a-z0-9]/gi, ''); // Sanitize extension
      
      // Server-controlled path - no user input
      const userScopedPath = `/users/${userId}/profile-${timestamp}-${randomId}.${extension}`;

      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL(userScopedPath);
      
      // Defensive check - ensure we got a valid URL
      if (!uploadURL) {
        console.error("ObjectStorageService returned falsy uploadURL");
        return res.status(500).json({ message: "Failed to generate upload URL - object storage misconfigured" });
      }
      
      res.json({ 
        uploadURL,
        objectPath: userScopedPath,
        expectedContentType: contentType, // Return expected type for client-side check
        expectedSize: fileSize
      });
    } catch (error: any) {
      console.error("Get upload URL error:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Resume upload endpoint - supports PDF files
  // SECURITY NOTE: This uses presigned URLs which means the actual file upload
  // goes directly to GCS. While we validate the client's claimed contentType and fileSize,
  // a malicious user could lie and upload different content. For production use, consider:
  // 1. Implementing server-side proxy upload with actual byte validation
  // 2. Using GCS Cloud Functions to validate files post-upload
  // 3. Rate limiting per user to prevent abuse
  app.post("/api/objects/upload-resume", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Validate file metadata from client claim
      const { contentType, fileSize } = req.body;
      
      // Strict validation of claimed file properties
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for documents
      const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      // Validate contentType
      if (!contentType || typeof contentType !== 'string') {
        return res.status(400).json({ message: "Content type is required" });
      }
      
      if (!ALLOWED_TYPES.includes(contentType)) {
        return res.status(400).json({ 
          message: "Invalid file type. Only PDF and Word documents (.pdf, .doc, .docx) are allowed." 
        });
      }
      
      // Validate fileSize
      if (!fileSize || typeof fileSize !== 'number' || fileSize <= 0) {
        return res.status(400).json({ message: "Valid file size is required" });
      }
      
      if (fileSize > MAX_FILE_SIZE) {
        return res.status(400).json({ 
          message: `File size must be under ${MAX_FILE_SIZE / 1024 / 1024}MB` 
        });
      }

      // Generate user-scoped path with sanitized extension
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      
      // Strictly map contentType to extension (no user input)
      const extensionMap: Record<string, string> = {
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
      };
      const extension = extensionMap[contentType];
      
      if (!extension) {
        return res.status(400).json({ message: "Unsupported content type" });
      }
      
      // Server-controlled path - no user input
      const userScopedPath = `/users/${userId}/resume-${timestamp}-${randomId}.${extension}`;

      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL(userScopedPath);
      
      // Defensive check - ensure we got a valid URL
      if (!uploadURL) {
        console.error("ObjectStorageService returned falsy uploadURL for resume");
        return res.status(500).json({ message: "Failed to generate upload URL - object storage misconfigured" });
      }
      
      res.json({ 
        uploadURL,
        objectPath: userScopedPath,
        expectedContentType: contentType,
        expectedSize: fileSize
      });
    } catch (error: any) {
      console.error("Get resume upload URL error:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Requirement document upload endpoint - supports PDF, DOC, DOCX files for job postings
  app.post("/api/objects/upload-document", isAuthenticated, isEmployer, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Validate file metadata from client claim
      const { contentType, fileSize } = req.body;
      
      // Strict validation of claimed file properties
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for documents
      const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      // Validate contentType
      if (!contentType || typeof contentType !== 'string') {
        return res.status(400).json({ message: "Content type is required" });
      }
      
      if (!ALLOWED_TYPES.includes(contentType)) {
        return res.status(400).json({ 
          message: "Invalid file type. Only PDF and Word documents (.pdf, .doc, .docx) are allowed." 
        });
      }
      
      // Validate fileSize
      if (!fileSize || typeof fileSize !== 'number' || fileSize <= 0) {
        return res.status(400).json({ message: "Valid file size is required" });
      }
      
      if (fileSize > MAX_FILE_SIZE) {
        return res.status(400).json({ 
          message: `File size must be under ${MAX_FILE_SIZE / 1024 / 1024}MB` 
        });
      }

      // Generate user-scoped path with sanitized extension
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      
      // Strictly map contentType to extension (no user input)
      const extensionMap: Record<string, string> = {
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
      };
      const extension = extensionMap[contentType];
      
      if (!extension) {
        return res.status(400).json({ message: "Unsupported content type" });
      }
      
      // Server-controlled path for requirement documents
      const userScopedPath = `/users/${userId}/requirement-${timestamp}-${randomId}.${extension}`;

      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL(userScopedPath);
      
      // Defensive check - ensure we got a valid URL
      if (!uploadURL) {
        console.error("ObjectStorageService returned falsy uploadURL for requirement document");
        return res.status(500).json({ message: "Failed to generate upload URL - object storage misconfigured" });
      }
      
      res.json({ 
        uploadURL,
        objectPath: userScopedPath,
        expectedContentType: contentType,
        expectedSize: fileSize
      });
    } catch (error: any) {
      console.error("Get requirement document upload URL error:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Local upload endpoint for development (bypasses Replit Object Storage)
  app.put("/api/local-upload/*", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const objectPath = req.path.replace("/api/local-upload", "");
      
      // Create uploads directory if it doesn't exist
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const uploadDir = path.join(process.cwd(), "uploads");
      await fs.mkdir(uploadDir, { recursive: true });
      
      const fullPath = path.join(uploadDir, objectPath);
      const dir = path.dirname(fullPath);
      await fs.mkdir(dir, { recursive: true });
      
      // For now, just return success - in a real implementation you'd handle the file
      res.status(200).json({ 
        message: "Local upload successful",
        path: `/objects${objectPath}`
      });
    } catch (error: any) {
      console.error("Local upload error:", error);
      res.status(500).json({ message: "Local upload failed" });
    }
  });

  app.put("/api/resume", isAuthenticated, async (req, res) => {
    try {
      if (!req.body.resumeUrl) {
        return res.status(400).json({ error: "resumeUrl is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.resumeUrl,
        {
          owner: getUserId(req),
          visibility: "private",
        },
      );

      const profile = await storage.getJobSeekerProfile(getUserId(req));
      if (profile) {
        await storage.updateJobSeekerProfile(profile.id, {
          resumeUrl: objectPath,
        });
      }

      res.status(200).json({ objectPath });
    } catch (error: any) {
      console.error("Error setting resume:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      
      if (!canAccess) {
        // Special case: Allow employers to view resumes of applicants who applied to their jobs
        const user = await storage.getUser(userId);
        if (user?.role === 'employer' && req.path.includes('/resume')) {
          // Extract the user ID from the path (e.g., /users/123/resume-...)
          const pathMatch = req.path.match(/\/users\/([^\/]+)\//);
          if (pathMatch) {
            const resumeOwnerId = pathMatch[1];
            
            // Check if the resume owner has applied to any of the employer's jobs
            const employerJobs = await storage.getJobsByEmployer(userId);
            for (const job of employerJobs) {
              const applications = await storage.getApplicationsByJob(job.id);
              const hasApplied = applications.some(app => app.seekerId === resumeOwnerId);
              if (hasApplied) {
                // Employer can access this resume because the user applied to their job
                objectStorageService.downloadObject(objectFile, res);
                return;
              }
            }
          }
        }
        
        // Also allow admins to view any document
        if (user?.role === 'admin') {
          objectStorageService.downloadObject(objectFile, res);
          return;
        }
        
        return res.sendStatus(401);
      }
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
