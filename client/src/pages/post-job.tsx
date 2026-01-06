import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Briefcase, MapPin, Users, Clock, ArrowLeft, Upload, FileText, X } from "lucide-react";
import { Link } from "wouter";

const jobSchema = z.object({
  title: z.string().min(3, "Job title must be at least 3 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  location: z.string().min(1, "Location is required"),
  jobType: z.enum(["full_time", "part_time", "contract", "remote", "hybrid"]),
  salaryMin: z.string().optional(),
  salaryMax: z.string().optional(),
  category: z.string().optional(),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  benefits: z.string().optional(),
  skills: z.string().optional(),
});

type JobForm = z.infer<typeof jobSchema>;

export default function PostJob() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [requirementDocumentUrl, setRequirementDocumentUrl] = useState<string | null>(null);

  const form = useForm<JobForm>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      jobType: "full_time",
      salaryMin: undefined,
      salaryMax: undefined,
      category: "",
      requirements: "",
      responsibilities: "",
      benefits: "",
      skills: "",
    },
  });

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({ 
        title: "Invalid file type", 
        description: "Only PDF, DOC, and DOCX files are allowed", 
        variant: "destructive" 
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({ 
        title: "File too large", 
        description: "Document must be under 10MB", 
        variant: "destructive" 
      });
      return;
    }

    try {
      setIsUploadingDocument(true);
      
      // Get upload URL from backend
      const response: any = await apiRequest("POST", "/api/objects/upload-document", {
        contentType: file.type,
        fileSize: file.size,
      });

      const { uploadURL, objectPath } = response;

      // Upload file directly to cloud storage
      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      // GCS returns 2xx status codes for successful uploads (200 or 204)
      if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
        const errorText = await uploadResponse.text().catch(() => 'Unknown error');
        console.error("GCS document upload failed:", uploadResponse.status, errorText);
        throw new Error("Failed to upload document to storage");
      }

      // Store the object path for later use
      setRequirementDocumentUrl(objectPath);
      toast({ title: "Document uploaded successfully!" });
    } catch (error: any) {
      console.error("Document upload error:", error);
      toast({ 
        title: "Upload failed", 
        description: error.message || "Failed to upload document", 
        variant: "destructive" 
      });
    } finally {
      setIsUploadingDocument(false);
    }
  };

  const createJobMutation = useMutation({
    mutationFn: async (data: JobForm) => {
      const payload = {
        ...data,
        // Convert salary strings to numbers or undefined
        salaryMin: data.salaryMin && data.salaryMin !== "" ? Number(data.salaryMin) : undefined,
        salaryMax: data.salaryMax && data.salaryMax !== "" ? Number(data.salaryMax) : undefined,
        requirements: data.requirements ? data.requirements.split("\n").filter(Boolean) : [],
        responsibilities: data.responsibilities ? data.responsibilities.split("\n").filter(Boolean) : [],
        benefits: data.benefits ? data.benefits.split("\n").filter(Boolean) : [],
        skills: data.skills ? data.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
        requirementDocumentUrl: requirementDocumentUrl || undefined,
      };
      return await apiRequest("POST", "/api/jobs", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employer/jobs"] });
      toast({ title: "Job posted successfully!" });
      setLocation("/employer/dashboard");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error posting job", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

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

      <div>
        <h1 className="text-3xl font-bold mb-2">Post a New Job</h1>
        <p className="text-muted-foreground">Fill out the details below to create a job posting</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Job Details
          </CardTitle>
          <CardDescription>Basic information about the position</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createJobMutation.mutate(data))} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Senior Software Engineer" data-testid="input-title" />
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
                        rows={6}
                        data-testid="input-description"
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
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input {...field} placeholder="City, Country or Remote" className="pl-10" data-testid="input-location" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Technology, Marketing" data-testid="input-category" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="jobType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-job-type">
                          <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="full_time">Full-time</SelectItem>
                        <SelectItem value="part_time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="salaryMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Salary (PHP, optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₱</span>
                          <Input 
                            {...field} 
                            type="number" 
                            placeholder="25000"
                            className="pl-10"
                            value={field.value === "" ? "" : field.value || ""}
                            data-testid="input-salary-min"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>Monthly salary in Philippine Peso</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salaryMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Salary (PHP, optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₱</span>
                          <Input 
                            {...field} 
                            type="number" 
                            placeholder="50000"
                            className="pl-10"
                            value={field.value === "" ? "" : field.value || ""}
                            data-testid="input-salary-max"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>Monthly salary in Philippine Peso</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Skills</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="JavaScript, React, Node.js, Python" data-testid="input-skills" />
                    </FormControl>
                    <FormDescription>Separate skills with commas</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requirements</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="List the job requirements (one per line)&#10;e.g.&#10;5+ years of experience&#10;Bachelor's degree in Computer Science"
                        rows={5}
                        data-testid="input-requirements"
                      />
                    </FormControl>
                    <FormDescription>One requirement per line</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsibilities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsibilities</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="List the key responsibilities (one per line)"
                        rows={5}
                        data-testid="input-responsibilities"
                      />
                    </FormControl>
                    <FormDescription>One responsibility per line</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="benefits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Benefits</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="List the benefits (one per line)&#10;e.g.&#10;Health insurance&#10;Remote work options"
                        rows={4}
                        data-testid="input-benefits"
                      />
                    </FormControl>
                    <FormDescription>One benefit per line</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Requirement Document (Optional)
                </label>
                <p className="text-sm text-muted-foreground">
                  Upload additional requirements document (PDF, DOC, DOCX - Max 10MB)
                </p>
                {requirementDocumentUrl ? (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm flex-1">Document uploaded</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRequirementDocumentUrl(null)}
                      data-testid="button-remove-document"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleDocumentUpload}
                      disabled={isUploadingDocument}
                      className="cursor-pointer"
                      data-testid="input-requirement-document"
                    />
                    {isUploadingDocument && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                        <span className="text-sm">Uploading...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  disabled={createJobMutation.isPending}
                  data-testid="button-submit"
                >
                  {createJobMutation.isPending ? "Posting..." : "Post Job"}
                </Button>
                <Link href="/employer/dashboard">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
