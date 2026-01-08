import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table with hybrid authentication (Replit Auth + legacy email/password)
// IMPORTANT: Replit Auth requires id, email, firstName, lastName, profileImageUrl
export const users = pgTable("users", {
  // Replit Auth fields (keep default for migration compatibility)
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(), // nullable - some Replit login methods don't have emails
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  
  // Legacy authentication fields (keep during migration)
  password: varchar("password"), // nullable for OAuth users
  isEmailVerified: boolean("is_email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationTokenExpiry: timestamp("email_verification_token_expiry"),
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpiry: timestamp("password_reset_expiry"),
  otp: varchar("otp"),
  otpExpiry: timestamp("otp_expiry"),
  otpAttempts: integer("otp_attempts").default(0),
  lastOtpResendAt: timestamp("last_otp_resend_at"),
  otpResendCount: integer("otp_resend_count").default(0),
  otpResendHourStart: timestamp("otp_resend_hour_start"),
  
  // ZambaJobs-specific fields
  role: varchar("role", { enum: ["job_seeker", "employer", "admin"] }),
  isFlagged: boolean("is_flagged").default(false).notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Job Seeker profiles
export const jobSeekerProfiles = pgTable("job_seeker_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  profileImage: varchar("profile_image"),
  headline: text("headline"),
  bio: text("bio"),
  skills: text("skills").array(),
  categories: text("categories").array(),
  resumeUrl: varchar("resume_url"),
  linkedinUrl: varchar("linkedin_url"),
  portfolioUrl: varchar("portfolio_url"),
  location: varchar("location"),
  phoneNumber: varchar("phone_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Work Experience
export const workExperience = pgTable("work_experience", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull().references(() => jobSeekerProfiles.id, { onDelete: "cascade" }),
  companyName: varchar("company_name").notNull(),
  position: varchar("position").notNull(),
  location: varchar("location"),
  startDate: varchar("start_date").notNull(),
  endDate: varchar("end_date"),
  isCurrent: boolean("is_current").default(false).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Education
export const education = pgTable("education", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull().references(() => jobSeekerProfiles.id, { onDelete: "cascade" }),
  institution: varchar("institution").notNull(),
  degree: varchar("degree").notNull(),
  fieldOfStudy: varchar("field_of_study"),
  startYear: varchar("start_year").notNull(),
  endYear: varchar("end_year"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Certifications
export const certifications = pgTable("certifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull().references(() => jobSeekerProfiles.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  issuer: varchar("issuer").notNull(),
  issueDate: varchar("issue_date"),
  expiryDate: varchar("expiry_date"),
  credentialUrl: varchar("credential_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Employer profiles
export const employerProfiles = pgTable("employer_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyName: varchar("company_name").notNull(),
  companyLogo: varchar("company_logo"),
  companyWebsite: varchar("company_website"),
  companyDescription: text("company_description"),
  industry: varchar("industry"),
  location: varchar("location"),
  phoneNumber: varchar("phone_number"),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Job postings
export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employerId: varchar("employer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").array(),
  responsibilities: text("responsibilities").array(),
  skills: text("skills").array(),
  location: varchar("location").notNull(),
  jobType: varchar("job_type", { enum: ["full_time", "part_time", "contract", "remote", "hybrid"] }).notNull(),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryCurrency: varchar("salary_currency").default("USD"),
  categories: text("categories").array(),
  companyName: varchar("company_name"),
  requirementDocumentUrl: varchar("requirement_document_url"),
  isActive: boolean("is_active").default(true).notNull(),
  isFlagged: boolean("is_flagged").default(false).notNull(),
  aiMatchScore: integer("ai_match_score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Job applications
export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  seekerId: varchar("seeker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  coverLetter: text("cover_letter"),
  status: varchar("status", { enum: ["applied", "reviewing", "shortlisted", "rejected", "accepted"] }).notNull().default("applied"),
  aiMatchScore: integer("ai_match_score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Fraud alerts
export const fraudAlerts = pgTable("fraud_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: varchar("entity_type", { enum: ["user", "job", "application"] }).notNull(),
  entityId: varchar("entity_id").notNull(),
  alertType: varchar("alert_type").notNull(),
  description: text("description").notNull(),
  aiConfidence: integer("ai_confidence").notNull(),
  status: varchar("status", { enum: ["pending", "reviewed", "dismissed", "confirmed"] }).notNull().default("pending"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
});

// Activity Logs - track platform activities for admin dashboard
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }), // nullable for system events
  entityType: varchar("entity_type", { enum: ["user", "job", "application", "profile", "fraud_alert", "system"] }).notNull(),
  entityId: varchar("entity_id"), // nullable for system-level events
  action: varchar("action").notNull(), // e.g., "created", "updated", "deleted", "flagged", "verified"
  description: text("description").notNull(),
  metadata: jsonb("metadata"), // Additional context (IP, session, etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_activity_entity").on(table.entityType, table.entityId),
  index("idx_activity_created").on(table.createdAt),
]);

// Contact Messages - support/contact form submissions
export const contactMessages = pgTable("contact_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }), // nullable for non-authenticated users
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  subject: varchar("subject"),
  message: text("message").notNull(),
  status: varchar("status", { enum: ["new", "read", "replied", "archived"] }).notNull().default("new"),
  priority: varchar("priority", { enum: ["low", "normal", "high", "urgent"] }).notNull().default("normal"),
  repliedBy: varchar("replied_by").references(() => users.id),
  replyMessage: text("reply_message"),
  handledAt: timestamp("handled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_contact_status").on(table.status),
  index("idx_contact_created").on(table.createdAt),
]);

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  jobSeekerProfile: one(jobSeekerProfiles, {
    fields: [users.id],
    references: [jobSeekerProfiles.userId],
  }),
  employerProfile: one(employerProfiles, {
    fields: [users.id],
    references: [employerProfiles.userId],
  }),
}));

export const jobSeekerProfilesRelations = relations(jobSeekerProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [jobSeekerProfiles.userId],
    references: [users.id],
  }),
  workExperience: many(workExperience),
  education: many(education),
  certifications: many(certifications),
}));

export const workExperienceRelations = relations(workExperience, ({ one }) => ({
  profile: one(jobSeekerProfiles, {
    fields: [workExperience.profileId],
    references: [jobSeekerProfiles.id],
  }),
}));

export const educationRelations = relations(education, ({ one }) => ({
  profile: one(jobSeekerProfiles, {
    fields: [education.profileId],
    references: [jobSeekerProfiles.id],
  }),
}));

export const certificationsRelations = relations(certifications, ({ one }) => ({
  profile: one(jobSeekerProfiles, {
    fields: [certifications.profileId],
    references: [jobSeekerProfiles.id],
  }),
}));

export const employerProfilesRelations = relations(employerProfiles, ({ one }) => ({
  user: one(users, {
    fields: [employerProfiles.userId],
    references: [users.id],
  }),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  employer: one(users, {
    fields: [jobs.employerId],
    references: [users.id],
  }),
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
  seeker: one(users, {
    fields: [applications.seekerId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isEmailVerified: true,
  emailVerificationToken: true,
  emailVerificationTokenExpiry: true,
  passwordResetToken: true,
  passwordResetExpiry: true,
  otp: true,
  otpExpiry: true,
  otpAttempts: true,
  lastOtpResendAt: true,
  otpResendCount: true,
  otpResendHourStart: true,
  isFlagged: true,
});

export const insertJobSeekerProfileSchema = createInsertSchema(jobSeekerProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkExperienceSchema = createInsertSchema(workExperience).omit({
  id: true,
  createdAt: true,
});

export const insertEducationSchema = createInsertSchema(education).omit({
  id: true,
  createdAt: true,
});

export const insertCertificationSchema = createInsertSchema(certifications).omit({
  id: true,
  createdAt: true,
});

export const insertEmployerProfileSchema = createInsertSchema(employerProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isVerified: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  employerId: true, // Omit because it's added from authenticated session
  createdAt: true,
  updatedAt: true,
  isActive: true,
  isFlagged: true,
  aiMatchScore: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  aiMatchScore: true,
});

export const insertFraudAlertSchema = createInsertSchema(fraudAlerts).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
  status: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  handledAt: true,
});

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;

export type JobSeekerProfile = typeof jobSeekerProfiles.$inferSelect;
export type InsertJobSeekerProfile = z.infer<typeof insertJobSeekerProfileSchema>;

export type WorkExperience = typeof workExperience.$inferSelect;
export type InsertWorkExperience = z.infer<typeof insertWorkExperienceSchema>;

export type Education = typeof education.$inferSelect;
export type InsertEducation = z.infer<typeof insertEducationSchema>;

export type Certification = typeof certifications.$inferSelect;
export type InsertCertification = z.infer<typeof insertCertificationSchema>;

export type EmployerProfile = typeof employerProfiles.$inferSelect;
export type InsertEmployerProfile = z.infer<typeof insertEmployerProfileSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;

export type FraudAlert = typeof fraudAlerts.$inferSelect;
export type InsertFraudAlert = z.infer<typeof insertFraudAlertSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
