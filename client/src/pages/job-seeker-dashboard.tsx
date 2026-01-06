import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Briefcase, 
  FileText, 
  TrendingUp, 
  Eye, 
  Sparkles, 
  User,
  GraduationCap,
  Award,
  Link as LinkIcon,
  Download,
  Upload
} from "lucide-react";
import type { Application, JobSeekerProfile } from "@shared/schema";

// Extended Job type with AI matching data
interface RecommendedJob {
  id: string;
  employerId: string;
  title: string;
  description: string;
  requirements: string[] | null;
  responsibilities: string[] | null;
  benefits: string[] | null;
  skills: string[] | null;
  location: string | null;
  jobType: string;
  category: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  isActive: boolean;
  isFlagged: boolean;
  createdAt: Date;
  requirementDocumentUrl: string | null;
  aiMatchScore?: number;
  aiMatchReasoning?: string;
}
import { useAuth } from "@/contexts/auth-context";

export default function JobSeekerDashboard() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useQuery<JobSeekerProfile>({
    queryKey: ["/api/profile"],
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const { data: recommendedJobs, isLoading: jobsLoading } = useQuery<RecommendedJob[]>({
    queryKey: ["/api/jobs/recommended"],
  });

  const profileCompletion = calculateProfileCompletion(profile);

  return (
    <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground">Here's what's happening with your job search</p>
        </div>

        {/* Profile Overview Card */}
        <Card data-testid="card-profile-overview">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              My Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Profile Picture */}
              <div className="flex flex-col items-center gap-2">
                <Avatar className="h-24 w-24">
                  {profile?.profileImage ? (
                    <AvatarImage 
                      src={`/objects${profile.profileImage}`}
                      alt={`${user?.firstName} ${user?.lastName}`}
                      data-testid="dashboard-profile-image"
                    />
                  ) : (
                    <AvatarFallback>
                      <User className="h-12 w-12 text-muted-foreground" />
                    </AvatarFallback>
                  )}
                </Avatar>
                {!profile?.profileImage && (
                  <Link href="/profile">
                    <Button variant="outline" size="sm" data-testid="button-upload-photo">
                      <Upload className="h-3 w-3 mr-2" />
                      Add Photo
                    </Button>
                  </Link>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg" data-testid="dashboard-user-name">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  {profile?.headline && (
                    <p className="text-sm text-muted-foreground" data-testid="dashboard-headline">
                      {profile.headline}
                    </p>
                  )}
                </div>

                {/* Resume Section */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Resume</h4>
                  {profile?.resumeUrl ? (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm flex-1">Resume uploaded</span>
                      <a 
                        href={`/objects${profile.resumeUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        data-testid="link-dashboard-resume"
                      >
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3 mr-2" />
                          View
                        </Button>
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md border border-dashed">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm flex-1 text-muted-foreground">No resume uploaded</span>
                      <Link href="/profile">
                        <Button variant="outline" size="sm" data-testid="button-upload-resume">
                          <Upload className="h-3 w-3 mr-2" />
                          Upload
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>

                <Link href="/profile">
                  <Button variant="outline" size="sm" data-testid="button-edit-profile">
                    Edit Profile
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Completion */}
            <Card data-testid="card-profile-completion">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Profile Completion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{profileCompletion}%</span>
                    <span className="text-xs text-muted-foreground">
                      {profileCompletion === 100 ? "Complete!" : "Keep going"}
                    </span>
                  </div>
                  <Progress value={profileCompletion} />
                </div>
                {profileCompletion < 100 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Complete your profile to:</p>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-primary" />
                        Get better job matches
                      </li>
                      <li className="flex items-center gap-2">
                        <Eye className="h-3 w-3 text-primary" />
                        Increase visibility
                      </li>
                      <li className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-primary" />
                        Stand out to employers
                      </li>
                    </ul>
                    <Link href="/profile">
                      <Button className="w-full mt-2" size="sm" data-testid="button-complete-profile">
                        Complete Profile
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Applications</span>
                  </div>
                  <span className="text-sm font-semibold" data-testid="stat-applications">
                    {applications?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <span>Recommendations</span>
                  </div>
                  <span className="text-sm font-semibold" data-testid="stat-recommendations">
                    {recommendedJobs?.length || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="recommended" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="recommended" data-testid="tab-recommended">
                  Recommended for You
                </TabsTrigger>
                <TabsTrigger value="applications" data-testid="tab-applications">
                  My Applications
                </TabsTrigger>
              </TabsList>

              <TabsContent value="recommended" className="space-y-4 mt-6">
                {jobsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i}>
                        <CardHeader>
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : recommendedJobs && recommendedJobs.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground" data-testid="text-recommendations-count">
                        Found {recommendedJobs.length} job{recommendedJobs.length !== 1 ? 's' : ''} matching your profile
                      </p>
                    </div>
                    {recommendedJobs.map((job) => (
                      <Card key={job.id} className="hover-elevate" data-testid={`card-recommended-job-${job.id}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center flex-wrap gap-2 mb-1">
                                <CardTitle>{job.title}</CardTitle>
                                {job.aiMatchScore !== undefined && (
                                  <Badge 
                                    variant={job.aiMatchScore >= 70 ? "default" : job.aiMatchScore >= 50 ? "secondary" : "outline"} 
                                    className="gap-1"
                                    data-testid={`badge-match-score-${job.id}`}
                                  >
                                    <Sparkles className="h-3 w-3" />
                                    {job.aiMatchScore}% Match
                                  </Badge>
                                )}
                              </div>
                              <CardDescription>{job.location}</CardDescription>
                            </div>
                          </div>
                          
                          {job.aiMatchReasoning && (
                            <div className="mt-3 p-3 bg-muted/50 rounded-md border-l-4 border-primary" data-testid={`text-match-reasoning-${job.id}`}>
                              <div className="flex items-start gap-2">
                                <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                <p className="text-sm text-muted-foreground italic">
                                  {job.aiMatchReasoning}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                            {job.description}
                          </p>
                        </CardHeader>
                        <CardContent className="pt-0 flex flex-wrap gap-2">
                          <Badge variant="secondary">{job.jobType.replace('_', ' ')}</Badge>
                          {job.category && <Badge variant="outline">{job.category}</Badge>}
                        </CardContent>
                        <CardContent className="pt-0">
                          <Link href={`/jobs/${job.id}`}>
                            <Button data-testid={`button-view-details-${job.id}`}>View Details</Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[300px] flex-col items-center justify-center text-center p-8">
                    <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No recommendations yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md mb-4">
                      Complete your profile to get personalized job recommendations
                    </p>
                    <Link href="/profile">
                      <Button>Complete Profile</Button>
                    </Link>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="applications" className="space-y-4 mt-6">
                {applicationsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i}>
                        <CardHeader>
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : applications && applications.length > 0 ? (
                  <div className="space-y-4">
                    {applications.map((application) => (
                      <Card key={application.id} className="hover-elevate" data-testid={`card-application-${application.id}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <CardTitle className="line-clamp-1">Application #{application.id.slice(0, 8)}</CardTitle>
                              <CardDescription>
                                Applied {new Date(application.createdAt).toLocaleDateString()}
                              </CardDescription>
                            </div>
                            <Badge 
                              variant={
                                application.status === "accepted" ? "default" :
                                application.status === "rejected" ? "destructive" :
                                application.status === "reviewing" ? "secondary" :
                                "outline"
                              }
                              data-testid={`badge-status-${application.id}`}
                            >
                              {application.status}
                            </Badge>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[300px] flex-col items-center justify-center text-center p-8">
                    <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md mb-4">
                      Start applying to jobs to track your applications here
                    </p>
                    <Link href="/jobs">
                      <Button>Browse Jobs</Button>
                    </Link>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
    </div>
  );
}

function calculateProfileCompletion(profile?: JobSeekerProfile): number {
  if (!profile) return 0;
  
  let completed = 0;
  const total = 7;
  
  if (profile.headline) completed++;
  if (profile.bio) completed++;
  if (profile.skills && profile.skills.length > 0) completed++;
  if (profile.resumeUrl) completed++;
  if (profile.linkedinUrl) completed++;
  if (profile.location) completed++;
  if (profile.phoneNumber) completed++;
  
  return Math.round((completed / total) * 100);
}
