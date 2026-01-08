import OpenAI from "openai";
import type { JobSeekerProfile, Job, User, EmployerProfile } from "@shared/schema";

const openai = (process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY) ? new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY
}) : null;

// Helper to check if OpenAI is available
export const isOpenAIAvailable = () => !!openai;

// Rate limiting to prevent quota exhaustion
let lastApiCall = 0;
const RATE_LIMIT_MS = 1000; // 1 second between calls

async function rateLimitedOpenaiCall<T>(apiCall: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCall;
  
  if (timeSinceLastCall < RATE_LIMIT_MS) {
    const waitTime = RATE_LIMIT_MS - timeSinceLastCall;
    console.log(`Rate limiting: waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastApiCall = Date.now();
  return apiCall();
}

interface FraudAnalysisResult {
  isFraudulent: boolean;
  confidence: number;
  reasons: string[];
  alertType: string;
}

export async function analyzeUserProfileForFraud(
  user: User,
  profile?: JobSeekerProfile | EmployerProfile,
  profileImageUrl?: string
): Promise<FraudAnalysisResult> {
  try {
    const profileData = JSON.stringify({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      profile: profile || {},
    });

    const messages: any[] = [
      {
        role: "system",
        content: "You are a fraud detection AI for a job portal. Analyze user profiles for signs of fraudulent activity, fake information, or suspicious patterns. Look for: inconsistencies in professional history, suspicious email patterns, implausible claims, copy-pasted generic content, missing critical information, or red flags. If a profile image is provided, analyze it for stock photos, inappropriate content, or suspicious elements. Respond in JSON format."
      }
    ];

    // Build user message with optional image
    const userContent: any[] = [
      {
        type: "text",
        text: `Analyze this user profile for fraud: ${profileData}. Return JSON with: { "isFraudulent": boolean, "confidence": number (0-100), "reasons": string[], "alertType": string }`
      }
    ];

    // Add image if profile image URL is provided
    if (profileImageUrl) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: profileImageUrl,
          detail: "auto"
        }
      });
    }

    messages.push({
      role: "user",
      content: userContent
    });

    if (!openai) {
      console.error("AI service not configured");
      return { isFraudulent: false, confidence: 0, reasons: ["AI service not configured"], alertType: "Config Error" };
    }
    const response = await rateLimitedOpenaiCall(() => openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages,
      response_format: { type: "json_object" },
      max_completion_tokens: 4096, // Increased to allow room for reasoning tokens + actual output
    }));

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error("Fraud analysis returned empty content");
      return { isFraudulent: false, confidence: 0, reasons: ["Analysis returned empty"], alertType: "Analysis Error" };
    }
    
    const result = JSON.parse(content);
    return {
      isFraudulent: result.isFraudulent || false,
      confidence: result.confidence || 0,
      reasons: result.reasons || [],
      alertType: result.alertType || "Suspicious Profile"
    };
  } catch (error) {
    console.error("Fraud analysis error:", error);
    return {
      isFraudulent: false,
      confidence: 0,
      reasons: ["Analysis failed"],
      alertType: "Analysis Error"
    };
  }
}

export async function analyzeJobPostingForFraud(
  job: Job
): Promise<FraudAnalysisResult> {
  try {
    // Check if OpenAI is available and has quota
    if (!openai) {
      console.error("AI service not configured");
      return { isFraudulent: false, confidence: 0, reasons: ["AI service not configured"], alertType: "Config Error" };
    }

    const jobData = JSON.stringify({
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      location: job.location,
      jobType: job.jobType,
    });

    const response = await rateLimitedOpenaiCall(() => openai.chat.completions.create({
      model: "gpt-4", // Use gpt-4 instead of gpt-5 to avoid potential issues
      messages: [
        {
          role: "system",
          content: "You are a fraud detection AI. Quickly analyze job postings for scams. Respond concisely in JSON."
        },
        {
          role: "user",
          content: `Analyze for fraud: ${jobData}. Return JSON: { "isFraudulent": boolean, "confidence": number (0-100), "reasons": string[], "alertType": string }`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500, // Reduced to prevent quota issues
    }));

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error("Job fraud analysis returned empty content");
      return { isFraudulent: false, confidence: 0, reasons: ["Analysis returned empty"], alertType: "Analysis Error" };
    }
    
    const result = JSON.parse(content);
    return {
      isFraudulent: result.isFraudulent || false,
      confidence: result.confidence || 0,
      reasons: result.reasons || [],
      alertType: result.alertType || "Suspicious Job Posting"
    };
  } catch (error) {
    console.error("Job fraud analysis error:", error);
    return {
      isFraudulent: false,
      confidence: 0,
      reasons: ["Analysis failed"],
      alertType: "Analysis Error"
    };
  }
}

interface JobMatchResult {
  matchScore: number;
  reasoning: string;
}

export async function calculateJobMatch(
  seekerProfile: JobSeekerProfile,
  job: Job,
  workExperience?: Array<{companyName: string, position: string, description?: string}>,
  education?: Array<{institution: string, degree: string, fieldOfStudy?: string}>,
  certifications?: Array<{name: string, issuer: string}>
): Promise<number> {
  const result = await calculateJobMatchWithReasoning(seekerProfile, job, workExperience, education, certifications);
  return result.matchScore;
}

export async function calculateJobMatchWithReasoning(
  seekerProfile: JobSeekerProfile,
  job: Job,
  workExperience?: Array<{companyName: string, position: string, description?: string}>,
  education?: Array<{institution: string, degree: string, fieldOfStudy?: string}>,
  certifications?: Array<{name: string, issuer: string}>
): Promise<JobMatchResult> {
  try {
    const profileData = {
      skills: seekerProfile.skills || [],
      headline: seekerProfile.headline,
      bio: seekerProfile.bio,
      location: seekerProfile.location,
      hasResume: !!seekerProfile.resumeUrl,
      portfolioUrl: seekerProfile.portfolioUrl,
      linkedinUrl: seekerProfile.linkedinUrl,
      workExperience: workExperience || [],
      education: education || [],
      certifications: certifications || [],
    };

    const jobData = {
      title: job.title,
      description: job.description,
      requirements: job.requirements || [],
      skills: job.skills || [],
      location: job.location,
      jobType: job.jobType,
      salaryRange: job.salaryMin && job.salaryMax ? `${job.salaryMin}-${job.salaryMax}` : undefined,
    };

    if (!openai) {
      console.error("AI service not configured");
      return { matchScore: 0, reasoning: "AI service not configured" };
    }
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an AI job matching expert for the Philippine job market. Quickly calculate how well a candidate matches a job. Return a match score from 0-100 where 90-100 is excellent, 70-89 is good, 50-69 is moderate, below 50 is poor fit. Respond concisely in JSON format."
        },
        {
          role: "user",
          content: `Match this candidate: ${JSON.stringify(profileData)} with this job: ${JSON.stringify(jobData)}. Return JSON: { "matchScore": number (0-100), "reasoning": string (1 sentence) }`
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048, // Increased to allow room for reasoning tokens + actual output
    });

    const rawContent = response.choices[0]?.message?.content;
    if (!rawContent) {
      console.error(`[AI Match] Empty content for "${job.title}"`);
      return { matchScore: 0, reasoning: "AI returned empty response" };
    }
    
    const result = JSON.parse(rawContent);
    
    // Handle different possible field names from the AI response
    const matchScore = result.matchScore ?? result.match_score ?? result.score ?? 0;
    const reasoning = result.reasoning ?? result.explanation ?? result.reason ?? "Unable to determine match reasoning";
    
    return { matchScore, reasoning };
  } catch (error: any) {
    console.error(`[AI Match] Error for job "${job.title}":`, error.message);
    return { matchScore: 0, reasoning: "Match calculation failed" };
  }
}

export async function findMatchingCandidates(
  job: Job,
  candidates: Array<{ 
    user: User; 
    profile: JobSeekerProfile;
    workExperience?: Array<{companyName: string, position: string, description?: string}>;
    education?: Array<{institution: string, degree: string, fieldOfStudy?: string}>;
    certifications?: Array<{name: string, issuer: string}>;
  }>
): Promise<Array<{ userId: string; matchScore: number }>> {
  try {
    const matches = await Promise.all(
      candidates.map(async (candidate) => {
        const score = await calculateJobMatch(
          candidate.profile, 
          job,
          candidate.workExperience,
          candidate.education,
          candidate.certifications
        );
        return {
          userId: candidate.user.id,
          matchScore: score,
        };
      })
    );

    return matches
      .filter(m => m.matchScore > 50)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);
  } catch (error) {
    console.error("Candidate matching error:", error);
    return [];
  }
}
