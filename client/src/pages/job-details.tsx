import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Building2, 
  CheckCircle,
  Sparkles,
  ArrowLeft,
  FileText,
  GraduationCap,
  Award,
  ExternalLink
} from "lucide-react";
import type { Job } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatPesoRange } from "@/lib/philippines";

export default function JobDetails() {
  const params = useParams();
  const jobId = params.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [coverLetter, setCoverLetter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string>("");
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  const { data: job, isLoading } = useQuery<Job>({
    queryKey: ["/api/jobs", jobId],
  });

  const { data: profile } = useQuery<any>({
    queryKey: ["/api/profile"],
  });

  const { data: workExperience = [] } = useQuery<any[]>({
    queryKey: ["/api/profile/work-experience"],
    enabled: dialogOpen,
  });

  const { data: education = [] } = useQuery<any[]>({
    queryKey: ["/api/profile/education"],
    enabled: dialogOpen,
  });

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({ 
        title: "Invalid file type", 
        description: "Only PDF and Word documents are allowed", 
        variant: "destructive" 
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({ 
        title: "File too large", 
        description: "Resume must be under 10MB", 
        variant: "destructive" 
      });
      return;
    }

    try {
      setIsUploadingResume(true);
      const response: any = await apiRequest("POST", "/api/objects/upload-resume", {
        contentType: file.type,
        fileSize: file.size
      });
      const { uploadURL, objectPath } = response;
      
      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload resume");
      }
      
      setResumeUrl(objectPath);
      toast({ title: "Resume uploaded", description: "Resume uploaded successfully" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingResume(false);
    }
  };

  const applyMutation = useMutation({
    mutationFn: async () => {
      // Ensure resume is uploaded before allowing application
      const currentResumeUrl = resumeUrl || profile?.resumeUrl;
      if (!currentResumeUrl) {
        throw new Error("Please upload your resume before applying");
      }

      // Update profile with resume if changed
      if (resumeUrl) {
        await apiRequest("PUT", "/api/profile", { resumeUrl });
      }
      
      return await apiRequest("POST", `/api/jobs/${jobId}/apply`, { coverLetter });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Application submitted!",
        description: "Your application has been sent to the employer.",
      });
      setDialogOpen(false);
      setCoverLetter("");
      setResumeUrl("");
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Job not found</h2>
          <Link href="/jobs">
            <Button>Browse Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
          <Link href="/jobs">
            <div className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-3 py-2">
              <Briefcase className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">ZambaJobs</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/jobs">
              <Button variant="ghost" data-testid="button-back-to-jobs">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Jobs
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container max-w-4xl mx-auto py-8 px-4 md:px-6 lg:px-8">
        {/* Job Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-md bg-primary/10">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl mb-2">{job.title}</CardTitle>
                    <CardDescription className="text-base flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Posted {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </CardDescription>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="gap-1">
                    <Briefcase className="h-3 w-3" />
                    {job.jobType.replace('_', ' ')}
                  </Badge>
                  {job.category && (
                    <Badge variant="outline">{job.category}</Badge>
                  )}
                  {job.aiMatchScore && job.aiMatchScore > 70 && (
                    <Badge variant="default" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      {job.aiMatchScore}% Match
                    </Badge>
                  )}
                </div>

                {(job.salaryMin || job.salaryMax) && (
                  <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <span>
                      {formatPesoRange(job.salaryMin, job.salaryMax)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="w-full sm:w-auto" data-testid="button-apply">
                  Apply Now
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Apply for {job.title}</DialogTitle>
                  <DialogDescription>
                    Review your portfolio and upload your resume to submit your application
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Work Experience Summary */}
                  {workExperience.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          Work Experience ({workExperience.length})
                        </label>
                        <Link href="/profile">
                          <Button variant="ghost" size="sm" className="gap-1">
                            Edit <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                      <div className="space-y-2">
                        {workExperience.slice(0, 3).map((exp: any) => (
                          <Card key={exp.id} className="p-3">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{exp.title}</h4>
                                <p className="text-sm text-muted-foreground truncate">{exp.company}</p>
                              </div>
                              <Badge variant="outline" className="text-xs whitespace-nowrap">
                                {new Date(exp.startDate).getFullYear()}
                                {exp.endDate ? ` - ${new Date(exp.endDate).getFullYear()}` : ' - Present'}
                              </Badge>
                            </div>
                          </Card>
                        ))}
                        {workExperience.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{workExperience.length - 3} more experience(s)
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Education Summary */}
                  {education.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          Education ({education.length})
                        </label>
                        <Link href="/profile">
                          <Button variant="ghost" size="sm" className="gap-1">
                            Edit <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                      <div className="space-y-2">
                        {education.slice(0, 2).map((edu: any) => (
                          <Card key={edu.id} className="p-3">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{edu.degree}</h4>
                                <p className="text-sm text-muted-foreground truncate">{edu.school}</p>
                              </div>
                              <Badge variant="outline" className="text-xs whitespace-nowrap">
                                {new Date(edu.graduationDate).getFullYear()}
                              </Badge>
                            </div>
                          </Card>
                        ))}
                        {education.length > 2 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{education.length - 2} more education(s)
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Add Portfolio Message if Empty */}
                  {workExperience.length === 0 && education.length === 0 && (
                    <Card className="p-4 bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Award className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Complete your portfolio</p>
                          <p className="text-xs text-muted-foreground">
                            Add your work experience and education to strengthen your application
                          </p>
                        </div>
                        <Link href="/profile">
                          <Button variant="outline" size="sm">
                            Add Now
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  )}

                  {/* Resume Upload */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Resume *</label>
                    {(resumeUrl || profile?.resumeUrl) && (
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm flex-1">Resume uploaded</span>
                        <a 
                          href={`/objects${resumeUrl || profile?.resumeUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          View
                        </a>
                      </div>
                    )}
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                      disabled={isUploadingResume}
                      data-testid="input-apply-resume"
                    />
                    {isUploadingResume && (
                      <p className="text-sm text-muted-foreground mt-2">Uploading resume...</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {profile?.resumeUrl ? "Update your resume" : "Upload your resume (PDF, DOC, or DOCX - max 10MB)"}
                    </p>
                  </div>

                  {/* Cover Letter */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Cover Letter (Optional)</label>
                    <Textarea
                      placeholder="Tell the employer why you're a great fit for this position..."
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      rows={6}
                      data-testid="textarea-cover-letter"
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => applyMutation.mutate()}
                    disabled={applyMutation.isPending || isUploadingResume || (!resumeUrl && !profile?.resumeUrl)}
                    data-testid="button-submit-application"
                  >
                    {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                  </Button>
                  {!resumeUrl && !profile?.resumeUrl && (
                    <p className="text-sm text-center text-muted-foreground">
                      Please upload your resume to continue
                    </p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Job Description */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p className="whitespace-pre-wrap">{job.description}</p>
          </CardContent>
        </Card>

        {/* Responsibilities */}
        {job.responsibilities && job.responsibilities.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Responsibilities</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {job.responsibilities.map((resp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Requirements */}
        {job.requirements && job.requirements.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {job.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Required Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, idx) => (
                  <Badge key={idx} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
