import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Plus, Users, Eye, Sparkles, TrendingUp, Building2 } from "lucide-react";
import type { Job, Application } from "@shared/schema";

export default function EmployerDashboard() {
  const { data: jobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/employer/jobs"],
  });

  const { data: candidates, isLoading: candidatesLoading } = useQuery<any[]>({
    queryKey: ["/api/employer/candidates"],
  });

  const activeJobs = jobs?.filter(j => j.isActive && !j.isFlagged) || [];
  const totalApplications = 0; // TODO: Get from applications query

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
            <Link href="/employer/post-job">
              <Button data-testid="button-post-job">
                <Plus className="mr-2 h-4 w-4" />
                Post a Job
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline" data-testid="button-profile">
                <Building2 className="mr-2 h-4 w-4" />
                Company Profile
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container max-w-7xl mx-auto py-8 px-4 md:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Employer Dashboard</h1>
          <p className="text-muted-foreground">Manage your job postings and find great candidates</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card data-testid="card-stat-jobs">
            <CardHeader className="pb-3">
              <CardDescription>Active Jobs</CardDescription>
              <CardTitle className="text-3xl">{activeJobs.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Briefcase className="h-3 w-3" />
                <span>Total postings</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-applications">
            <CardHeader className="pb-3">
              <CardDescription>Total Applications</CardDescription>
              <CardTitle className="text-3xl">{totalApplications}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>From all jobs</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-candidates">
            <CardHeader className="pb-3">
              <CardDescription>Recommended Candidates</CardDescription>
              <CardTitle className="text-3xl">{candidates?.length || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                <span>AI-matched</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="jobs" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="jobs" data-testid="tab-jobs">
              My Job Postings
            </TabsTrigger>
            <TabsTrigger value="candidates" data-testid="tab-candidates">
              Recommended Candidates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-4 mt-6">
            {activeJobs.length > 0 ? (
              <div className="space-y-4">
                {activeJobs.map((job) => (
                  <Card key={job.id} className="hover-elevate" data-testid={`card-job-${job.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle>{job.title}</CardTitle>
                            {job.isActive && (
                              <Badge variant="default">Active</Badge>
                            )}
                          </div>
                          <CardDescription>{job.location} • {job.jobType.replace('_', ' ')}</CardDescription>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                        {job.description}
                      </p>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                    <CardContent className="pt-0 flex gap-2">
                      <Link href={`/employer/jobs/${job.id}`}>
                        <Button data-testid={`button-manage-${job.id}`}>Manage</Button>
                      </Link>
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="outline" data-testid={`button-preview-${job.id}`}>Preview</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-8">
                <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No active job postings</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-4">
                  Create your first job posting to start finding great candidates
                </p>
                <Link href="/employer/post-job">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Post a Job
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="candidates" className="space-y-4 mt-6">
            {candidates && candidates.length > 0 ? (
              <div className="space-y-4">
                {candidates.map((candidate) => (
                  <Card key={candidate.id} className="hover-elevate" data-testid={`card-candidate-${candidate.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle>{candidate.firstName} {candidate.lastName}</CardTitle>
                            {candidate.matchScore && (
                              <Badge variant="default" className="gap-1">
                                <Sparkles className="h-3 w-3" />
                                {candidate.matchScore}% Match
                              </Badge>
                            )}
                          </div>
                          <CardDescription>{candidate.headline || "Job Seeker"}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                      <Button data-testid={`button-view-candidate-${candidate.id}`}>View Profile</Button>
                      <Button variant="outline">Message</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-8">
                <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No candidate recommendations yet</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-4">
                  Post jobs to get AI-powered candidate recommendations
                </p>
                <Link href="/employer/post-job">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Post a Job
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
