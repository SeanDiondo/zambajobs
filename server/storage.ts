import {
  users,
  jobSeekerProfiles,
  workExperience,
  education,
  certifications,
  employerProfiles,
  jobs,
  applications,
  fraudAlerts,
  activityLogs,
  contactMessages,
  type User,
  type UpsertUser,
  type InsertUser,
  type JobSeekerProfile,
  type InsertJobSeekerProfile,
  type WorkExperience,
  type InsertWorkExperience,
  type Education,
  type InsertEducation,
  type Certification,
  type InsertCertification,
  type EmployerProfile,
  type InsertEmployerProfile,
  type Job,
  type InsertJob,
  type Application,
  type InsertApplication,
  type FraudAlert,
  type InsertFraudAlert,
  type ActivityLog,
  type InsertActivityLog,
  type ContactMessage,
  type InsertContactMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, ilike, or } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  
  // Job Seeker Profile operations
  getJobSeekerProfile(userId: string): Promise<JobSeekerProfile | undefined>;
  createJobSeekerProfile(profile: InsertJobSeekerProfile): Promise<JobSeekerProfile>;
  updateJobSeekerProfile(id: string, data: Partial<JobSeekerProfile>): Promise<JobSeekerProfile>;
  
  // Work Experience operations
  getWorkExperience(profileId: string): Promise<WorkExperience[]>;
  createWorkExperience(experience: InsertWorkExperience): Promise<WorkExperience>;
  deleteWorkExperience(id: string): Promise<void>;
  
  // Education operations
  getEducation(profileId: string): Promise<Education[]>;
  createEducation(edu: InsertEducation): Promise<Education>;
  deleteEducation(id: string): Promise<void>;
  
  // Certification operations
  getCertifications(profileId: string): Promise<Certification[]>;
  createCertification(cert: InsertCertification): Promise<Certification>;
  deleteCertification(id: string): Promise<void>;
  
  // Employer Profile operations
  getEmployerProfile(userId: string): Promise<EmployerProfile | undefined>;
  createEmployerProfile(profile: InsertEmployerProfile): Promise<EmployerProfile>;
  updateEmployerProfile(id: string, data: Partial<EmployerProfile>): Promise<EmployerProfile>;
  
  // Job operations
  getAllJobs(filters?: any): Promise<Job[]>;
  getJob(id: string): Promise<Job | undefined>;
  getJobsByEmployer(employerId: string): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, data: Partial<Job>): Promise<Job>;
  deleteJob(id: string): Promise<void>;
  
  // Application operations
  getAllApplications(): Promise<Application[]>;
  getApplication(id: string): Promise<Application | undefined>;
  getApplicationsBySeeker(seekerId: string): Promise<Application[]>;
  getApplicationsByJob(jobId: string): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: string, data: Partial<Application>): Promise<Application>;
  
  // Fraud Alert operations
  getAllFraudAlerts(): Promise<FraudAlert[]>;
  getFraudAlert(id: string): Promise<FraudAlert | null>;
  getPendingFraudAlerts(): Promise<FraudAlert[]>;
  createFraudAlert(alert: InsertFraudAlert): Promise<FraudAlert>;
  updateFraudAlert(id: string, data: Partial<FraudAlert>): Promise<FraudAlert>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  getUsersWithStats(): Promise<any[]>;
  deleteUser(id: string): Promise<void>;
  
  // Activity Log operations
  getRecentActivityLogs(limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  
  // Contact Message operations
  getAllContactMessages(): Promise<ContactMessage[]>;
  getContactMessagesByStatus(status: string): Promise<ContactMessage[]>;
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  updateContactMessage(id: string, data: Partial<ContactMessage>): Promise<ContactMessage>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.emailVerificationToken, token));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Job Seeker Profile operations
  async getJobSeekerProfile(userId: string): Promise<JobSeekerProfile | undefined> {
    const [profile] = await db
      .select()
      .from(jobSeekerProfiles)
      .where(eq(jobSeekerProfiles.userId, userId));
    return profile || undefined;
  }

  async createJobSeekerProfile(profile: InsertJobSeekerProfile): Promise<JobSeekerProfile> {
    const [newProfile] = await db.insert(jobSeekerProfiles).values(profile).returning();
    return newProfile;
  }

  async updateJobSeekerProfile(id: string, data: Partial<JobSeekerProfile>): Promise<JobSeekerProfile> {
    const [profile] = await db
      .update(jobSeekerProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(jobSeekerProfiles.id, id))
      .returning();
    return profile;
  }

  // Work Experience operations
  async getWorkExperience(profileId: string): Promise<WorkExperience[]> {
    return await db
      .select()
      .from(workExperience)
      .where(eq(workExperience.profileId, profileId))
      .orderBy(desc(workExperience.startDate));
  }

  async createWorkExperience(experience: InsertWorkExperience): Promise<WorkExperience> {
    const [exp] = await db.insert(workExperience).values(experience).returning();
    return exp;
  }

  async deleteWorkExperience(id: string): Promise<void> {
    await db.delete(workExperience).where(eq(workExperience.id, id));
  }

  // Education operations
  async getEducation(profileId: string): Promise<Education[]> {
    return await db
      .select()
      .from(education)
      .where(eq(education.profileId, profileId))
      .orderBy(desc(education.startYear));
  }

  async createEducation(edu: InsertEducation): Promise<Education> {
    const [newEdu] = await db.insert(education).values(edu).returning();
    return newEdu;
  }

  async deleteEducation(id: string): Promise<void> {
    await db.delete(education).where(eq(education.id, id));
  }

  // Certification operations
  async getCertifications(profileId: string): Promise<Certification[]> {
    return await db
      .select()
      .from(certifications)
      .where(eq(certifications.profileId, profileId))
      .orderBy(desc(certifications.issueDate));
  }

  async createCertification(cert: InsertCertification): Promise<Certification> {
    const [newCert] = await db.insert(certifications).values(cert).returning();
    return newCert;
  }

  async deleteCertification(id: string): Promise<void> {
    await db.delete(certifications).where(eq(certifications.id, id));
  }

  // Employer Profile operations
  async getEmployerProfile(userId: string): Promise<EmployerProfile | undefined> {
    const [profile] = await db
      .select()
      .from(employerProfiles)
      .where(eq(employerProfiles.userId, userId));
    return profile || undefined;
  }

  async createEmployerProfile(profile: InsertEmployerProfile): Promise<EmployerProfile> {
    const [newProfile] = await db.insert(employerProfiles).values(profile).returning();
    return newProfile;
  }

  async updateEmployerProfile(id: string, data: Partial<EmployerProfile>): Promise<EmployerProfile> {
    const [profile] = await db
      .update(employerProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(employerProfiles.id, id))
      .returning();
    return profile;
  }

  // Job operations
  async getAllJobs(filters?: any): Promise<Job[]> {
    let query = db.select().from(jobs);
    
    if (filters?.isActive !== undefined) {
      query = query.where(eq(jobs.isActive, filters.isActive)) as any;
    }
    
    return await query.orderBy(desc(jobs.createdAt));
  }

  async getJob(id: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || undefined;
  }

  async getJobsByEmployer(employerId: string): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.employerId, employerId))
      .orderBy(desc(jobs.createdAt));
  }

  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db.insert(jobs).values(job).returning();
    return newJob;
  }

  async updateJob(id: string, data: Partial<Job>): Promise<Job> {
    const [job] = await db
      .update(jobs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return job;
  }

  async deleteJob(id: string): Promise<void> {
    await db.delete(jobs).where(eq(jobs.id, id));
  }

  // Application operations
  async getAllApplications(): Promise<Application[]> {
    return await db
      .select()
      .from(applications)
      .orderBy(desc(applications.createdAt));
  }

  async getApplication(id: string): Promise<Application | undefined> {
    const [app] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id))
      .limit(1);
    return app || undefined;
  }

  async getApplicationsBySeeker(seekerId: string): Promise<Application[]> {
    return await db
      .select()
      .from(applications)
      .where(eq(applications.seekerId, seekerId))
      .orderBy(desc(applications.createdAt));
  }

  async getApplicationsByJob(jobId: string): Promise<Application[]> {
    return await db
      .select()
      .from(applications)
      .where(eq(applications.jobId, jobId))
      .orderBy(desc(applications.createdAt));
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const [app] = await db.insert(applications).values(application).returning();
    return app;
  }

  async updateApplication(id: string, data: Partial<Application>): Promise<Application> {
    const [app] = await db
      .update(applications)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();
    return app;
  }

  // Fraud Alert operations
  async getAllFraudAlerts(): Promise<FraudAlert[]> {
    return await db
      .select()
      .from(fraudAlerts)
      .orderBy(desc(fraudAlerts.createdAt));
  }

  async getFraudAlert(id: string): Promise<FraudAlert | null> {
    const [alert] = await db
      .select()
      .from(fraudAlerts)
      .where(eq(fraudAlerts.id, id))
      .limit(1);
    return alert || null;
  }

  async getPendingFraudAlerts(): Promise<FraudAlert[]> {
    return await db
      .select()
      .from(fraudAlerts)
      .where(eq(fraudAlerts.status, "pending"))
      .orderBy(desc(fraudAlerts.createdAt));
  }

  async createFraudAlert(alert: InsertFraudAlert): Promise<FraudAlert> {
    const [newAlert] = await db.insert(fraudAlerts).values(alert).returning();
    return newAlert;
  }

  async updateFraudAlert(id: string, data: Partial<FraudAlert>): Promise<FraudAlert> {
    const [alert] = await db
      .update(fraudAlerts)
      .set(data)
      .where(eq(fraudAlerts.id, id))
      .returning();
    return alert;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async getUsersWithStats(): Promise<any[]> {
    // Get all users with aggregated statistics and full details
    const allUsers = await this.getAllUsers();
    const allFraudAlerts = await this.getAllFraudAlerts();
    
    const usersWithStats = await Promise.all(
      allUsers.map(async (user) => {
        let stats: any = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
          flagged: user.isFlagged,
        };

        // Include fraud alert info if user is flagged
        if (user.isFlagged) {
          const userAlerts = allFraudAlerts.filter(
            alert => alert.entityType === 'user' && alert.entityId === user.id
          );
          if (userAlerts.length > 0) {
            // Get the most recent alert for this user
            const latestAlert = userAlerts.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0];
            stats.fraudAlertReason = latestAlert.description;
            stats.fraudAlertType = latestAlert.alertType;
            stats.fraudAlertConfidence = latestAlert.aiConfidence;
            stats.fraudAlertStatus = latestAlert.status;
          }
        }

        if (user.role === 'job_seeker') {
          const profile = await this.getJobSeekerProfile(user.id);
          const apps = await this.getApplicationsBySeeker(profile?.id || '');
          stats.totalApplications = apps.length;
          stats.profileComplete = !!profile?.headline;
          
          // Include profile details
          if (profile) {
            stats.headline = profile.headline;
            stats.bio = profile.bio;
            stats.location = profile.location;
            stats.phoneNumber = profile.phoneNumber;
            stats.skills = profile.skills;
            stats.resumeUrl = profile.resumeUrl;
            stats.profilePictureUrl = profile.profileImage;
            stats.portfolioUrl = profile.portfolioUrl;
          }
        } else if (user.role === 'employer') {
          const profile = await this.getEmployerProfile(user.id);
          const employerJobs = await this.getJobsByEmployer(user.id);
          stats.totalJobs = employerJobs.length;
          
          // Include employer profile details
          if (profile) {
            stats.companyName = profile.companyName;
            stats.bio = profile.companyDescription;
            stats.location = profile.location;
            stats.website = profile.companyWebsite;
            stats.phoneNumber = profile.phoneNumber;
            stats.profilePictureUrl = profile.companyLogo;
          }
        }

        return stats;
      })
    );

    return usersWithStats;
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Cascade delete based on user role
    if (user.role === 'job_seeker') {
      const profile = await this.getJobSeekerProfile(userId);
      if (profile) {
        // Delete work experience
        const experiences = await this.getWorkExperience(profile.id);
        for (const exp of experiences) {
          await db.delete(workExperience).where(eq(workExperience.id, exp.id));
        }

        // Delete education
        const educations = await this.getEducation(profile.id);
        for (const edu of educations) {
          await db.delete(education).where(eq(education.id, edu.id));
        }

        // Delete certifications
        const certs = await this.getCertifications(profile.id);
        for (const cert of certs) {
          await db.delete(certifications).where(eq(certifications.id, cert.id));
        }

        // Delete applications
        const apps = await this.getApplicationsBySeeker(profile.id);
        for (const app of apps) {
          await db.delete(applications).where(eq(applications.id, app.id));
        }

        // Delete profile
        await db.delete(jobSeekerProfiles).where(eq(jobSeekerProfiles.userId, userId));
      }
    } else if (user.role === 'employer') {
      const profile = await this.getEmployerProfile(userId);
      if (profile) {
        // Delete all jobs posted by employer (and their applications)
        const employerJobs = await this.getJobsByEmployer(userId);
        for (const job of employerJobs) {
          // Delete applications for this job
          await db.delete(applications).where(eq(applications.jobId, job.id));
          // Delete the job
          await db.delete(jobs).where(eq(jobs.id, job.id));
        }

        // Delete employer profile
        await db.delete(employerProfiles).where(eq(employerProfiles.userId, userId));
      }
    }

    // Delete fraud alerts related to this user
    await db.delete(fraudAlerts).where(
      and(
        eq(fraudAlerts.entityType, "user"),
        eq(fraudAlerts.entityId, userId)
      )
    );

    // Finally, delete the user
    await db.delete(users).where(eq(users.id, userId));
  }

  // Activity Log operations
  async getRecentActivityLogs(limit: number = 50): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db.insert(activityLogs).values(log).returning();
    return newLog;
  }

  // Contact Message operations
  async getAllContactMessages(): Promise<ContactMessage[]> {
    return await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt));
  }

  async getContactMessagesByStatus(status: string): Promise<ContactMessage[]> {
    return await db
      .select()
      .from(contactMessages)
      .where(eq(contactMessages.status, status))
      .orderBy(desc(contactMessages.createdAt));
  }

  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const [newMessage] = await db.insert(contactMessages).values(message).returning();
    return newMessage;
  }

  async updateContactMessage(id: string, data: Partial<ContactMessage>): Promise<ContactMessage> {
    const [message] = await db
      .update(contactMessages)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(contactMessages.id, id))
      .returning();
    return message;
  }
}

export const storage = new DatabaseStorage();
