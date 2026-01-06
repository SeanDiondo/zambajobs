import { Router } from "express";
import { storage } from "../storage";
import { insertContactMessageSchema, insertUserSchema } from "@shared/schema";
import { ActivityLogger } from "../logger";
import { z } from "zod";
import bcrypt from "bcrypt";

export function createAdminRouter() {
  const router = Router();

  // Activity Logs
  router.get("/activity", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getRecentActivityLogs(Math.min(limit, 200)); // Max 200
      res.json(logs);
    } catch (error: any) {
      console.error("Get activity logs error:", error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // Contact Messages - List all with optional status filter
  router.get("/contacts", async (req, res) => {
    try {
      const status = req.query.status as string;
      
      let messages;
      if (status && ['new', 'read', 'replied', 'archived'].includes(status)) {
        messages = await storage.getContactMessagesByStatus(status);
      } else {
        messages = await storage.getAllContactMessages();
      }
      
      res.json(messages);
    } catch (error: any) {
      console.error("Get contact messages error:", error);
      res.status(500).json({ message: "Failed to fetch contact messages" });
    }
  });

  // Contact Messages - Update message (reply, change status, etc.)
  router.put("/contacts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateSchema = z.object({
        status: z.enum(['new', 'read', 'replied', 'archived']).optional(),
        priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
        replyMessage: z.string().optional(),
      });

      const validatedData = updateSchema.parse(req.body);
      
      // Validate that 'replied' status requires a reply message
      if (validatedData.status === 'replied' && !validatedData.replyMessage) {
        return res.status(400).json({ message: "Reply message is required when setting status to 'replied'" });
      }
      
      // Add handledAt timestamp and repliedBy when reply is provided
      const updateData: any = { ...validatedData };
      if (validatedData.status === 'replied' && validatedData.replyMessage) {
        updateData.handledAt = new Date();
        // Use the logged-in admin user's ID
        updateData.repliedBy = (req as any).session?.userId;
      }
      
      const updated = await storage.updateContactMessage(id, updateData);
      
      res.json(updated);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Update contact message error:", error);
      res.status(500).json({ message: "Failed to update contact message" });
    }
  });

  // Flag/Unflag Job
  router.put("/jobs/:id/flag", async (req, res) => {
    try {
      const { id } = req.params;
      const { flagged } = req.body;
      
      const job = await storage.getJob(id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      const updated = await storage.updateJob(id, { isFlagged: flagged });
      
      // Log the action
      const adminEmail = (req as any).session?.userEmail || 'admin';
      await ActivityLogger.log({
        action: flagged ? 'flag' : 'unflag',
        description: `Job "${job.title}" ${flagged ? 'flagged' : 'unflagged'} by ${adminEmail}`,
        entityType: 'job',
        entityId: id,
      });
      
      res.json(updated);
    } catch (error: any) {
      console.error("Flag job error:", error);
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  // Global Search - Search across users, jobs, applications
  router.get("/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const type = (req.query.type as string) || 'all';
      
      if (!query || query.trim().length < 2) {
        return res.status(400).json({ message: "Search query must be at least 2 characters" });
      }

      const results: any = {
        users: [],
        jobs: [],
      };

      // Search users (if type is 'user' or 'all')
      if (type === 'user' || type === 'all') {
        const allUsers = await storage.getAllUsers();
        results.users = allUsers.filter(user => 
          user.email?.toLowerCase().includes(query.toLowerCase()) ||
          user.firstName?.toLowerCase().includes(query.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 20); // Limit to 20 results
      }

      // Search jobs (if type is 'job' or 'all')
      if (type === 'job' || type === 'all') {
        const allJobs = await storage.getAllJobs();
        results.jobs = allJobs.filter(job => 
          job.title?.toLowerCase().includes(query.toLowerCase()) ||
          job.description?.toLowerCase().includes(query.toLowerCase()) ||
          job.location?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 20); // Limit to 20 results
      }

      res.json({
        query,
        type,
        results,
        totalResults: results.users.length + results.jobs.length,
      });
    } catch (error: any) {
      console.error("Global search error:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Delete User
  router.delete("/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent deleting yourself
      const currentUserId = (req as any).session?.userId;
      if (currentUserId === id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(id);
      
      // Log the action
      const adminEmail = (req as any).session?.userEmail || 'admin';
      await ActivityLogger.log({
        action: 'delete',
        description: `User ${user.email} deleted by ${adminEmail}`,
        entityType: 'user',
        entityId: id,
      });
      
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: error.message || "Failed to delete user" });
    }
  });

  // Create Admin Account
  router.post("/users/admin", async (req, res) => {
    try {
      const createAdminSchema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
      });

      const validatedData = createAdminSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      // Create admin user with all necessary fields
      const newAdmin = await storage.createUser({
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: 'admin',
      });
      
      // Update to mark email as verified (admin accounts don't need verification)
      await storage.updateUser(newAdmin.id, { isEmailVerified: true });
      
      // Log the action
      const adminEmail = (req as any).session?.userEmail || 'admin';
      await ActivityLogger.log({
        action: 'create',
        description: `Admin account created for ${validatedData.email} by ${adminEmail}`,
        entityType: 'user',
        entityId: newAdmin.id,
      });
      
      // Return user without password
      const { password, ...safeUser } = newAdmin;
      res.status(201).json(safeUser);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create admin error:", error);
      res.status(500).json({ message: "Failed to create admin account" });
    }
  });

  return router;
}
