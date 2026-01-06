import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Users, Mail, Phone, FileText, Sparkles, MapPin, Briefcase, Download, User, Eye, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import type { Job, Application } from "@shared/schema";

const jobEditSchema = z.object({
  title: z.string().min(3, "Job title must be at least 3 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  location: z.string().min(1, "Location is required"),
  jobType: z.enum(["full_time", "part_time", "contract", "remote", "hybrid"]),
  salaryMin: z.string().optional(),
  salaryMax: z.string().optional(),
  category: z.string().optional(),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  skills: z.string().optional(),
});

type JobEditForm = z.infer<typeof jobEditSchema>;

export default function JobManagement() {
  const [, params] = useRoute("/employer/jobs/:id");
  const jobId = params?.id;
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: job, isLoading: jobLoading } = useQuery<Job>({
    queryKey: ["/api/jobs", jobId],
    enabled: !!jobId,
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: ["/api/employer/jobs", jobId, "applications"],
    enabled: !!jobId,
  });

  const form = useForm<JobEditForm>({
    resolver: zodResolver(jobEditSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      jobType: "full_time",
      salaryMin: "",
      salaryMax: "",
      category: "",
      requirements: "",
      responsibilities: "",
      skills: "",
    },
  });

  // Update form when job data loads
  useEffect(() => {
    if (job) {
      form.reset({
        title: job.title,
        description: job.description,
        location: job.location,
        jobType: job.jobType,
        salaryMin: job.salaryMin?.toString() || "",
        salaryMax: job.salaryMax?.toString() || "",
        category: job.category || "",
        requirements: job.requirements?.join("\n") || "",
        responsibilities: job.responsibilities?.join("\n") || "",
        skills: job.skills?.join(", ") || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job]);

  const updateJobMutation = useMutation({
    mutationFn: async (data: JobEditForm) => {
      const payload = {
        ...data,
        salaryMin: data.salaryMin && data.salaryMin !== "" ? Number(data.salaryMin) : undefined,
        salaryMax: data.salaryMax && data.salaryMax !== "" ? Number(data.salaryMax) : undefined,
        requirements: data.requirements ? data.requirements.split("\n").filter(Boolean) : [],
        responsibilities: data.responsibilities ? data.responsibilities.split("\n").filter(Boolean) : [],
        skills: data.skills ? data.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
      };
      return await apiRequest("PUT", `/api/jobs/${jobId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId] });
      queryClient.invalidateQueries({ queryKey: ["/api/employer/jobs"] });
      toast({ title: "Job updated successfully!" });
      setEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error updating job", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PUT", `/api/jobs/${jobId}`, { isActive: !job?.isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId] });
      queryClient.invalidateQueries({ queryKey: ["/api/employer/jobs"] });
      toast({ title: job?.isActive ? "Job deactivated" : "Job activated" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error toggling job status", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/jobs/${jobId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employer/jobs"] });
      toast({ title: "Job deleted successfully" });
      navigate("/employer/dashboard");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error deleting job", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const updateApplicationStatusMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: string; status: string }) => {
      return await apiRequest("PUT", `/api/applications/${applicationId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employer/jobs", jobId, "applications"] });
      toast({ title: "Application status updated successfully!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error updating application status", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  if (jobLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Job not found</p>
        <Link href="/employer/dashboard">
          <Button className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const pendingApps = applications?.filter(a => a.status === "applied") || [];
  const reviewingApps = applications?.filter(a => a.status === "reviewing") || [];
  const acceptedApps = applications?.filter(a => a.status === "accepted") || [];
  const rejectedApps = applications?.filter(a => a.status === "rejected") || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/employer/dashboard">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Job Details */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{job.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-2">
                <MapPin className="h-4 w-4" />
                {job.location} • {job.jobType}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={job.isActive ? "default" : "secondary"} data-testid="badge-job-status">
                {job.isActive ? "Active" : "Inactive"}
              </Badge>
              
              {/* Action Buttons */}
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="button-edit-job">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Job Posting</DialogTitle>
                    <DialogDescription>Update the job details below</DialogDescription>
                  </DialogHeader>
                  <EditJobForm 
                    form={form} 
                    onSubmit={(data) => updateJobMutation.mutate(data)} 
                    isPending={updateJobMutation.isPending}
                  />
                </DialogContent>
              </Dialog>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => toggleActiveMutation.mutate()}
                disabled={toggleActiveMutation.isPending}
                data-testid="button-toggle-active"
              >
                {job.isActive ? <ToggleRight className="h-4 w-4 mr-2" /> : <ToggleLeft className="h-4 w-4 mr-2" />}
                {job.isActive ? "Deactivate" : "Activate"}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" data-testid="button-delete-job">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Job Posting</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this job posting? This action cannot be undone.
                      All applications for this job will also be affected.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteJobMutation.mutate()}
                      className="bg-destructive hover:bg-destructive/90"
                      data-testid="button-confirm-delete"
                    >
                      {deleteJobMutation.isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground">{job.description}</p>
          </div>

          {job.skills && job.skills.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, idx) => (
                  <Badge key={idx} variant="outline">{skill}</Badge>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{applications?.length || 0} Applications</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span>{job.jobType}</span>
            </div>
            {job.salaryMin && job.salaryMax && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">
                  ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Applications
          </CardTitle>
          <CardDescription>Review and manage candidate applications</CardDescription>
        </CardHeader>
        <CardContent>
          {applicationsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : applications && applications.length > 0 ? (
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pending" data-testid="tab-pending">
                  Pending ({pendingApps.length})
                </TabsTrigger>
                <TabsTrigger value="reviewing" data-testid="tab-reviewing">
                  Reviewing ({reviewingApps.length})
                </TabsTrigger>
                <TabsTrigger value="accepted" data-testid="tab-accepted">
                  Accepted ({acceptedApps.length})
                </TabsTrigger>
                <TabsTrigger value="rejected" data-testid="tab-rejected">
                  Rejected ({rejectedApps.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4 mt-6">
                {pendingApps.length > 0 ? (
                  pendingApps.map((app) => (
                    <ApplicationCard 
                      key={app.id} 
                      application={app} 
                      onUpdateStatus={(status) => updateApplicationStatusMutation.mutate({ applicationId: app.id, status })}
                      isPending={updateApplicationStatusMutation.isPending}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No pending applications</p>
                )}
              </TabsContent>

              <TabsContent value="reviewing" className="space-y-4 mt-6">
                {reviewingApps.length > 0 ? (
                  reviewingApps.map((app) => (
                    <ApplicationCard 
                      key={app.id} 
                      application={app} 
                      onUpdateStatus={(status) => updateApplicationStatusMutation.mutate({ applicationId: app.id, status })}
                      isPending={updateApplicationStatusMutation.isPending}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No applications under review</p>
                )}
              </TabsContent>

              <TabsContent value="accepted" className="space-y-4 mt-6">
                {acceptedApps.length > 0 ? (
                  acceptedApps.map((app) => (
                    <ApplicationCard 
                      key={app.id} 
                      application={app} 
                      onUpdateStatus={(status) => updateApplicationStatusMutation.mutate({ applicationId: app.id, status })}
                      isPending={updateApplicationStatusMutation.isPending}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No accepted applications</p>
                )}
              </TabsContent>

              <TabsContent value="rejected" className="space-y-4 mt-6">
                {rejectedApps.length > 0 ? (
                  rejectedApps.map((app) => (
                    <ApplicationCard 
                      key={app.id} 
                      application={app} 
                      onUpdateStatus={(status) => updateApplicationStatusMutation.mutate({ applicationId: app.id, status })}
                      isPending={updateApplicationStatusMutation.isPending}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No rejected applications</p>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center p-8">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
              <p className="text-sm text-muted-foreground">
                Applications will appear here once candidates apply
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ApplicationCard({ 
  application, 
  onUpdateStatus,
  isPending 
}: { 
  application: any;
  onUpdateStatus: (status: string) => void;
  isPending: boolean;
}) {
  const applicant = application.applicant || {};
  const fullName = applicant.firstName && applicant.lastName 
    ? `${applicant.firstName} ${applicant.lastName}`
    : "Anonymous Applicant";

  return (
    <Card data-testid={`application-${application.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              {applicant.profileImage && (
                <AvatarImage 
                  src={`/objects${applicant.profileImage}`}
                  alt={fullName}
                />
              )}
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{fullName}</CardTitle>
              <CardDescription className="flex flex-col gap-1 mt-1">
                <span>{applicant.headline || "Job Seeker"}</span>
                <span className="flex items-center gap-2 flex-wrap">
                  {applicant.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {applicant.location}
                    </span>
                  )}
                  {application.aiMatchScore && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-primary" />
                        {application.aiMatchScore}% match
                      </span>
                    </>
                  )}
                </span>
              </CardDescription>
            </div>
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
      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="grid gap-3 md:grid-cols-2">
          {applicant.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${applicant.email}`} className="text-primary hover:underline">
                {applicant.email}
              </a>
            </div>
          )}
          {applicant.phoneNumber && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{applicant.phoneNumber}</span>
            </div>
          )}
        </div>

        {/* Skills */}
        {applicant.skills && applicant.skills.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Skills</h4>
            <div className="flex flex-wrap gap-2">
              {applicant.skills.slice(0, 6).map((skill: string, idx: number) => (
                <Badge key={idx} variant="outline">{skill}</Badge>
              ))}
              {applicant.skills.length > 6 && (
                <Badge variant="outline">+{applicant.skills.length - 6} more</Badge>
              )}
            </div>
          </div>
        )}

        {/* Work Experience */}
        {applicant.workExperience && applicant.workExperience.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Work Experience</h4>
            <div className="space-y-2">
              {applicant.workExperience.slice(0, 3).map((exp: any, idx: number) => (
                <div key={idx} className="text-sm">
                  <p className="font-medium">{exp.jobTitle}</p>
                  <p className="text-muted-foreground">{exp.company}</p>
                </div>
              ))}
              {applicant.workExperience.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{applicant.workExperience.length - 3} more position{applicant.workExperience.length - 3 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Education */}
        {applicant.education && applicant.education.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Education</h4>
            <div className="space-y-2">
              {applicant.education.slice(0, 2).map((edu: any, idx: number) => (
                <div key={idx} className="text-sm">
                  <p className="font-medium">{edu.degree}</p>
                  <p className="text-muted-foreground">{edu.institution}</p>
                </div>
              ))}
              {applicant.education.length > 2 && (
                <p className="text-xs text-muted-foreground">
                  +{applicant.education.length - 2} more degree{applicant.education.length - 2 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Resume Download */}
        {applicant.resumeUrl && (
          <div>
            <a 
              href={`/objects${applicant.resumeUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`link-resume-${application.id}`}
            >
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Download Resume
              </Button>
            </a>
          </div>
        )}

        {/* Cover Letter */}
        {application.coverLetter && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Cover Letter
            </h4>
            <p className="text-sm text-muted-foreground">{application.coverLetter}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Link href={`/employer/applicant/${applicant.id}`}>
            <Button size="sm" variant="secondary" data-testid={`button-view-portfolio-${application.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              View Portfolio
            </Button>
          </Link>
          <Button 
            size="sm" 
            onClick={() => onUpdateStatus("accepted")}
            disabled={isPending || application.status === "accepted"}
            data-testid={`button-accept-${application.id}`}
          >
            Accept
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onUpdateStatus("reviewing")}
            disabled={isPending || application.status === "reviewing"}
            data-testid={`button-review-${application.id}`}
          >
            Review
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => onUpdateStatus("rejected")}
            disabled={isPending || application.status === "rejected"}
            data-testid={`button-reject-${application.id}`}
          >
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EditJobForm({ form, onSubmit, isPending }: { form: any; onSubmit: (data: JobEditForm) => void; isPending: boolean }) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Senior Software Engineer" data-testid="input-edit-title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Description</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Describe the role, company culture, and what makes this opportunity unique..." 
                  rows={5}
                  data-testid="input-edit-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="City, Country or Remote" data-testid="input-edit-location" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="jobType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-edit-jobtype">
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="salaryMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Salary (PHP)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" placeholder="e.g. 30000" data-testid="input-edit-salary-min" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="salaryMax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Salary (PHP)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" placeholder="e.g. 50000" data-testid="input-edit-salary-max" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category (Optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Technology, Marketing" data-testid="input-edit-category" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="skills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Required Skills (Optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. JavaScript, React, Node.js" data-testid="input-edit-skills" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requirements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Requirements (Optional, one per line)</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="3+ years experience&#10;Bachelor's degree&#10;Strong communication skills"
                  rows={4}
                  data-testid="input-edit-requirements"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="responsibilities"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsibilities (Optional, one per line)</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Develop new features&#10;Code reviews&#10;Mentor junior developers"
                  rows={4}
                  data-testid="input-edit-responsibilities"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => form.reset()} data-testid="button-reset-form">
            Reset
          </Button>
          <Button type="submit" disabled={isPending} data-testid="button-submit-edit">
            {isPending ? "Updating..." : "Update Job"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
