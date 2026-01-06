import { storage } from "./storage";
import type { InsertActivityLog } from "@shared/schema";

export const ActivityLogger = {
  async log(data: InsertActivityLog): Promise<void> {
    try {
      await storage.createActivityLog(data);
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  },

  async logUserCreated(userId: string, email: string, role: string): Promise<void> {
    await this.log({
      userId,
      entityType: "user",
      entityId: userId,
      action: "created",
      description: `New ${role} account created: ${email}`,
      metadata: { email, role },
    });
  },

  async logUserUpdated(userId: string, actorId: string, changes: string): Promise<void> {
    await this.log({
      userId: actorId,
      entityType: "user",
      entityId: userId,
      action: "updated",
      description: `User account updated: ${changes}`,
      metadata: { changes },
    });
  },

  async logUserFlagged(userId: string, actorId: string, flagged: boolean): Promise<void> {
    await this.log({
      userId: actorId,
      entityType: "user",
      entityId: userId,
      action: flagged ? "flagged" : "unflagged",
      description: `User ${flagged ? "flagged" : "unflagged"} by admin`,
      metadata: { flagged },
    });
  },

  async logJobCreated(jobId: string, employerId: string, title: string): Promise<void> {
    await this.log({
      userId: employerId,
      entityType: "job",
      entityId: jobId,
      action: "created",
      description: `New job posted: ${title}`,
      metadata: { title },
    });
  },

  async logJobUpdated(jobId: string, employerId: string, title: string): Promise<void> {
    await this.log({
      userId: employerId,
      entityType: "job",
      entityId: jobId,
      action: "updated",
      description: `Job updated: ${title}`,
      metadata: { title },
    });
  },

  async logJobDeleted(jobId: string, employerId: string, title: string): Promise<void> {
    await this.log({
      userId: employerId,
      entityType: "job",
      entityId: jobId,
      action: "deleted",
      description: `Job deleted: ${title}`,
      metadata: { title },
    });
  },

  async logApplicationSubmitted(applicationId: string, seekerId: string, jobTitle: string): Promise<void> {
    await this.log({
      userId: seekerId,
      entityType: "application",
      entityId: applicationId,
      action: "created",
      description: `Application submitted for: ${jobTitle}`,
      metadata: { jobTitle },
    });
  },

  async logApplicationStatusChanged(applicationId: string, actorId: string, oldStatus: string, newStatus: string): Promise<void> {
    await this.log({
      userId: actorId,
      entityType: "application",
      entityId: applicationId,
      action: "updated",
      description: `Application status changed from ${oldStatus} to ${newStatus}`,
      metadata: { oldStatus, newStatus },
    });
  },

  async logProfileUpdated(profileId: string, userId: string, profileType: "job_seeker" | "employer"): Promise<void> {
    await this.log({
      userId,
      entityType: "profile",
      entityId: profileId,
      action: "updated",
      description: `${profileType === "job_seeker" ? "Job seeker" : "Employer"} profile updated`,
      metadata: { profileType },
    });
  },

  async logFraudAlertCreated(alertId: string, entityType: string, entityId: string): Promise<void> {
    await this.log({
      userId: null,
      entityType: "fraud_alert",
      entityId: alertId,
      action: "created",
      description: `AI fraud alert generated for ${entityType}: ${entityId}`,
      metadata: { alertEntityType: entityType, alertEntityId: entityId },
    });
  },

  async logFraudAlertReviewed(alertId: string, reviewerId: string, status: string): Promise<void> {
    await this.log({
      userId: reviewerId,
      entityType: "fraud_alert",
      entityId: alertId,
      action: "updated",
      description: `Fraud alert reviewed: ${status}`,
      metadata: { status },
    });
  },

  async logSystemEvent(description: string, metadata?: any): Promise<void> {
    await this.log({
      userId: null,
      entityType: "system",
      entityId: null,
      action: "system",
      description,
      metadata,
    });
  },
};
