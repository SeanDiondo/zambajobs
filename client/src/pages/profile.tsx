import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MultiSelect } from "@/components/ui/multi-select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/auth-context";
import { 
  User, Briefcase, GraduationCap, Award, FileText, Plus, Trash2, 
  MapPin, Phone, Linkedin, Globe, Upload, Building2
} from "lucide-react";
import type { JobSeekerProfile, WorkExperience, Education, Certification, EmployerProfile } from "@shared/schema";
import { PhilippineDatePicker } from "@/components/philippine-date-picker";
import { formatPhilippinePhone, isValidPhilippinePhone } from "@/lib/philippines";

const profileSchema = z.object({
  headline: z.string().min(3, "Headline must be at least 3 characters").or(z.literal("")).optional(),
  bio: z.string().min(10, "Bio must be at least 10 characters").or(z.literal("")).optional(),
  location: z.string().optional(),
  phoneNumber: z.string()
    .optional()
    .refine((val) => !val || val.trim() === "" || isValidPhilippinePhone(val), {
      message: "Please enter a valid Philippine phone number (e.g., +63 912-345-6789 or 0912-345-6789)",
    })
    .transform((val) => (val && val.trim()) ? formatPhilippinePhone(val) : val),
  linkedinUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  portfolioUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  skills: z.string().optional(), // Comma-separated
  categories: z.array(z.string()).optional(), // Multiple job categories
  profileImage: z.string().optional(),
  resumeUrl: z.string().optional(),
});

const workExpSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  position: z.string().min(1, "Position is required"),
  location: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"), // YYYY-MM format
  endDate: z.string().optional(), // YYYY-MM format
  isCurrent: z.boolean().default(false),
  description: z.string().optional(),
});

const educationSchema = z.object({
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().min(1, "Degree is required"),
  fieldOfStudy: z.string().optional(),
  startYear: z.string().min(1, "Start year is required"),
  endYear: z.string().optional(),
  description: z.string().optional(),
});

const certificationSchema = z.object({
  name: z.string().min(1, "Certificate name is required"),
  issuer: z.string().min(1, "Issuer is required"),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  credentialUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ProfileForm = z.infer<typeof profileSchema>;
type WorkExpForm = z.infer<typeof workExpSchema>;
type EducationForm = z.infer<typeof educationSchema>;
type CertificationForm = z.infer<typeof certificationSchema>;

const categoryOptions = [
    { value: "agriculture", label: "Agriculture & Farming" },
    { value: "fishing", label: "Fishing & Aquaculture" },
    { value: "tourism", label: "Tourism & Hospitality" },
    { value: "mining", label: "Mining & Minerals" },
    { value: "construction", label: "Construction" },
    { value: "education", label: "Education" },
    { value: "healthcare", label: "Healthcare" },
    { value: "government", label: "Government Service" },
    { value: "retail", label: "Retail & Sales" },
    { value: "food-service", label: "Food Service" },
    { value: "transportation", label: "Transportation & Logistics" },
    { value: "manufacturing", label: "Manufacturing" },
    { value: "it-technology", label: "IT & Technology" },
    { value: "administrative", label: "Administrative & Office" },
    { value: "customer-service", label: "Customer Service" },
    { value: "skilled-trade", label: "Skilled Trade" },
    { value: "security", label: "Security Services" },
    { value: "real-estate", label: "Real Estate" },
    { value: "finance", label: "Finance & Accounting" },
    { value: "marketing", label: "Marketing & Communications" },
    { value: "engineering", label: "Engineering" },
    { value: "environmental", label: "Environmental Services" },
  ];

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showWorkExpForm, setShowWorkExpForm] = useState(false);
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [showCertForm, setShowCertForm] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  const { data: profileData, isLoading } = useQuery<any>({
    queryKey: ["/api/profile"],
  });

  const profile = profileData as JobSeekerProfile & {
    workExperience?: WorkExperience[];
    education?: Education[];
    certifications?: Certification[];
  };
  
  const employerProfile = profileData as EmployerProfile;

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      headline: "",
      bio: "",
      location: "",
      phoneNumber: "",
      linkedinUrl: "",
      portfolioUrl: "",
      skills: "",
      categories: [],
      profileImage: "",
      resumeUrl: "",
    },
  });

  // Reset form when profile data is first loaded (not on every update)
  useEffect(() => {
    if (profile && !isLoading) {
      form.reset({
        headline: profile.headline || "",
        bio: profile.bio || "",
        location: profile.location || "",
        phoneNumber: profile.phoneNumber || "",
        linkedinUrl: profile.linkedinUrl || "",
        portfolioUrl: profile.portfolioUrl || "",
        skills: profile.skills?.join(", ") || "",
        categories: profile.categories || [],
        profileImage: profile.profileImage || "",
        resumeUrl: profile.resumeUrl || "",
      });
    }
  }, [profile?.id, isLoading, form]); // Include form in dependencies
  
  // Employer form - always initialize to avoid hooks violation
  const employerForm = useForm({
    defaultValues: {
      companyName: employerProfile?.companyName || "",
      companyDescription: employerProfile?.companyDescription || "",
      industry: employerProfile?.industry || "",
      companyWebsite: employerProfile?.companyWebsite || "",
      location: employerProfile?.location || "",
    },
    values: {
      companyName: employerProfile?.companyName || "",
      companyDescription: employerProfile?.companyDescription || "",
      industry: employerProfile?.industry || "",
      companyWebsite: employerProfile?.companyWebsite || "",
      location: employerProfile?.location || "",
    },
  });

  const workExpForm = useForm<WorkExpForm>({
    resolver: zodResolver(workExpSchema),
    defaultValues: {
      companyName: "",
      position: "",
      location: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: "",
    },
  });

  const educationForm = useForm<EducationForm>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startYear: "",
      endYear: "",
      description: "",
    },
  });

  const certForm = useForm<CertificationForm>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      name: "",
      issuer: "",
      issueDate: "",
      expiryDate: "",
      credentialUrl: "",
    },
  });

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
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
      
      // Get resume upload URL with validation
      const response = await apiRequest("POST", "/api/objects/upload-resume", {
        contentType: file.type,
        fileSize: file.size
      });
      const data: any = await response.json();
      const { uploadURL, objectPath } = data;
      console.log("DEBUG: Resume upload response:", { uploadURL: uploadURL ? "YES" : "NO", objectPath });
      
      // Upload resume to object storage
      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      // GCS returns 2xx status codes for successful uploads (200 or 204)
      if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
        const errorText = await uploadResponse.text().catch(() => 'Unknown error');
        console.error("GCS resume upload failed:", uploadResponse.status, errorText);
        throw new Error("Failed to upload resume to storage");
      }
      
      // DO NOT set form value here - wait until save succeeds
      
      // Automatically save the complete current form state with new resume URL
      try {
        const currentFormData = form.getValues();
        
        // Convert empty strings to undefined for optional fields (allows validation to pass)
        const dataToValidate = {
          headline: currentFormData.headline?.trim() || undefined,
          bio: currentFormData.bio?.trim() || undefined,
          location: currentFormData.location?.trim() || undefined,
          phoneNumber: currentFormData.phoneNumber?.trim() || undefined,
          linkedinUrl: currentFormData.linkedinUrl?.trim() || undefined,
          portfolioUrl: currentFormData.portfolioUrl?.trim() || undefined,
          skills: currentFormData.skills?.trim() || undefined,
          profileImage: currentFormData.profileImage || undefined,
          resumeUrl: objectPath || undefined,
        };
        
        // Validate form data before auto-saving
        const validationResult = await profileSchema.safeParseAsync(dataToValidate);
        
        if (!validationResult.success) {
          // Reset form value to previous state since we can't auto-save
          form.setValue("resumeUrl", profile?.resumeUrl || "");
          
          // Show specific validation errors
          const errors = validationResult.error.issues.map(i => i.message).join(", ");
          toast({ 
            title: "Resume uploaded but not saved", 
            description: `Please fix validation errors: ${errors}`,
            variant: "destructive"
          });
          return;
        }
        
        // Use validated data (includes transforms like phone number formatting)
        const validatedData = validationResult.data;
        const skillsArray = validatedData.skills?.trim() 
          ? validatedData.skills.split(",").map(s => s.trim()).filter(Boolean)
          : [];
        const categoriesArray = validatedData.categories || [];
        
        // Build profile update with explicit file URLs
        const profileUpdate: any = {
          headline: validatedData.headline,
          bio: validatedData.bio,
          location: validatedData.location,
          phoneNumber: validatedData.phoneNumber,
          linkedinUrl: validatedData.linkedinUrl,
          portfolioUrl: validatedData.portfolioUrl,
          skills: skillsArray,
          categories: categoriesArray,
          resumeUrl: objectPath, // NEW resume URL from upload
        };
        
        // Preserve existing profile image
        if (currentFormData.profileImage) {
          profileUpdate.profileImage = currentFormData.profileImage;
        }
        
        console.log("DEBUG: Sending resume update with:", { resumeUrl: profileUpdate.resumeUrl });
        await apiRequest("PUT", "/api/profile", profileUpdate);
        
        // Only update form value AFTER successful save
        form.setValue("resumeUrl", objectPath);
        
        // Update the query cache to reflect the change (for dashboard/other views)
        queryClient.setQueryData(["/api/profile"], (old: any) => ({
          ...old,
          resumeUrl: objectPath
        }));
        
        toast({ title: "Resume uploaded", description: "Resume uploaded and profile saved successfully" });
      } catch (saveError: any) {
        // If save fails, reset form value to maintain UI consistency
        form.setValue("resumeUrl", profile?.resumeUrl || "");
        throw new Error("Failed to save resume: " + saveError.message);
      }
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({ 
        title: "Invalid file type", 
        description: "Only JPEG, PNG, and WebP images are allowed", 
        variant: "destructive" 
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({ 
        title: "File too large", 
        description: "Image must be under 5MB", 
        variant: "destructive" 
      });
      return;
    }

    try {
      setIsUploadingImage(true);
      
      // Get user-scoped upload URL with validation
      const response = await apiRequest("POST", "/api/objects/upload", {
        contentType: file.type,
        fileSize: file.size
      });
      const data: any = await response.json();
      const { uploadURL, objectPath } = data;
      console.log("DEBUG: Image upload response:", { uploadURL: uploadURL ? "YES" : "NO", objectPath });
      
      // Upload image to object storage
      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      // GCS returns 2xx status codes for successful uploads (200 or 204)
      if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
        const errorText = await uploadResponse.text().catch(() => 'Unknown error');
        console.error("GCS image upload failed:", uploadResponse.status, errorText);
        throw new Error("Failed to upload image to storage");
      }
      
      // DO NOT set form value here - wait until save succeeds
      
      // Automatically save the complete current form state with new profile image
      try {
        const currentFormData = form.getValues();
        
        // Convert empty strings to undefined for optional fields (allows validation to pass)
        const dataToValidate = {
          headline: currentFormData.headline?.trim() || undefined,
          bio: currentFormData.bio?.trim() || undefined,
          location: currentFormData.location?.trim() || undefined,
          phoneNumber: currentFormData.phoneNumber?.trim() || undefined,
          linkedinUrl: currentFormData.linkedinUrl?.trim() || undefined,
          portfolioUrl: currentFormData.portfolioUrl?.trim() || undefined,
          skills: currentFormData.skills?.trim() || undefined,
          profileImage: objectPath,
          resumeUrl: currentFormData.resumeUrl || undefined,
        };
        
        // Validate form data before auto-saving
        const validationResult = await profileSchema.safeParseAsync(dataToValidate);
        
        if (!validationResult.success) {
          // Reset form value to previous state since we can't auto-save
          form.setValue("profileImage", profile?.profileImage || "");
          
          // Show specific validation errors
          const errors = validationResult.error.issues.map(i => i.message).join(", ");
          toast({ 
            title: "Image uploaded but not saved", 
            description: `Please fix validation errors: ${errors}`,
            variant: "destructive"
          });
          return;
        }
        
        // Use validated data (includes transforms like phone number formatting)
        const validatedData = validationResult.data;
        const skillsArray = validatedData.skills?.trim()
          ? validatedData.skills.split(",").map(s => s.trim()).filter(Boolean)
          : [];
        const categoriesArray = validatedData.categories || [];
        
        // Build profile update with explicit file URLs
        const profileUpdate: any = {
          headline: validatedData.headline,
          bio: validatedData.bio,
          location: validatedData.location,
          phoneNumber: validatedData.phoneNumber,
          linkedinUrl: validatedData.linkedinUrl,
          portfolioUrl: validatedData.portfolioUrl,
          skills: skillsArray,
          categories: categoriesArray,
          profileImage: objectPath, // NEW profile image from upload
        };
        
        // Preserve existing resume
        if (currentFormData.resumeUrl) {
          profileUpdate.resumeUrl = currentFormData.resumeUrl;
        }
        
        console.log("DEBUG: Sending image update with:", { profileImage: profileUpdate.profileImage });
        await apiRequest("PUT", "/api/profile", profileUpdate);
        
        // Only update form value AFTER successful save
        form.setValue("profileImage", objectPath);
        
        // Update the query cache to reflect the change (for dashboard/other views)
        queryClient.setQueryData(["/api/profile"], (old: any) => ({
          ...old,
          profileImage: objectPath
        }));
        
        toast({ title: "Image uploaded", description: "Profile image uploaded and profile saved successfully" });
      } catch (saveError: any) {
        // If save fails, reset form value to maintain UI consistency
        form.setValue("profileImage", profile?.profileImage || "");
        throw new Error("Failed to save profile image: " + saveError.message);
      }
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      // Convert empty strings to undefined for optional fields
      const cleanedData = {
        headline: data.headline?.trim() || undefined,
        bio: data.bio?.trim() || undefined,
        location: data.location?.trim() || undefined,
        phoneNumber: data.phoneNumber?.trim() || undefined,
        linkedinUrl: data.linkedinUrl?.trim() || undefined,
        portfolioUrl: data.portfolioUrl?.trim() || undefined,
        skills: data.skills?.trim() 
          ? data.skills.split(",").map(s => s.trim()).filter(Boolean)
          : [],
        categories: data.categories || [],
        profileImage: data.profileImage || undefined,
        resumeUrl: data.resumeUrl || undefined,
      };
      return await apiRequest("PUT", "/api/profile", cleanedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Profile updated", description: "Your profile has been updated successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addWorkExpMutation = useMutation({
    mutationFn: async (data: WorkExpForm) => {
      return await apiRequest("POST", "/api/profile/work-experience", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Work experience added" });
      setShowWorkExpForm(false);
      workExpForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteWorkExpMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/profile/work-experience/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Work experience deleted" });
    },
  });

  const addEducationMutation = useMutation({
    mutationFn: async (data: EducationForm) => {
      return await apiRequest("POST", "/api/profile/education", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Education added" });
      setShowEducationForm(false);
      educationForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteEducationMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/profile/education/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Education deleted" });
    },
  });

  const addCertificationMutation = useMutation({
    mutationFn: async (data: CertificationForm) => {
      return await apiRequest("POST", "/api/profile/certifications", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Certification added" });
      setShowCertForm(false);
      certForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteCertificationMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/profile/certifications/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Certification deleted" });
    },
  });

  // Employer update mutation - always initialize to avoid hooks violation
  const updateEmployerMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", "/api/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Company profile updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  // Employer Profile Form
  if (user?.role === "employer") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Company Profile</h1>
          <p className="text-muted-foreground">Manage your company information</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...employerForm}>
              <form onSubmit={employerForm.handleSubmit((data) => updateEmployerMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={employerForm.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-company-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={employerForm.control}
                  name="companyDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={4} data-testid="input-company-desc" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={employerForm.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Technology, Finance" data-testid="input-industry" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={employerForm.control}
                    name="companyWebsite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Website</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input {...field} placeholder="https://company.com" className="pl-10" data-testid="input-website" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={employerForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input {...field} placeholder="City, Country" className="pl-10" data-testid="input-location" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" disabled={updateEmployerMutation.isPending} data-testid="button-save-profile">
                  {updateEmployerMutation.isPending ? "Saving..." : "Save Company Profile"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.role !== "job_seeker") {
    return <div className="p-8">Profile not available for this role.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-muted-foreground">Manage your professional profile</p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>Your professional headline and contact details</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
              {/* Profile Image Upload - EXPERIMENTAL */}
              <FormField
                control={form.control}
                name="profileImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Image</FormLabel>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        {field.value && (
                          <AvatarImage 
                            src={`/objects${field.value}`}
                            alt="Profile"
                            data-testid="profile-image-preview"
                          />
                        )}
                        <AvatarFallback>
                          <User className="h-10 w-10 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                      <FormControl>
                        <div>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={isUploadingImage}
                            className="max-w-sm"
                            data-testid="input-profile-image"
                          />
                          {isUploadingImage && (
                            <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
                          )}
                        </div>
                      </FormControl>
                    </div>
                    <FormDescription>Upload a professional photo</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Resume Upload */}
              <FormField
                control={form.control}
                name="resumeUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resume</FormLabel>
                    <div className="space-y-2">
                      {field.value && (
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm flex-1">Resume uploaded</span>
                          <a 
                            href={`/objects${field.value}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                            data-testid="link-resume-view"
                          >
                            View
                          </a>
                        </div>
                      )}
                      <FormControl>
                        <div>
                          <Input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleResumeUpload}
                            disabled={isUploadingResume}
                            className="max-w-sm"
                            data-testid="input-resume"
                          />
                          {isUploadingResume && (
                            <p className="text-sm text-muted-foreground mt-2">Uploading resume...</p>
                          )}
                        </div>
                      </FormControl>
                    </div>
                    <FormDescription>Upload your resume (PDF, DOC, or DOCX - max 10MB)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="headline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Headline</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Senior Software Engineer" data-testid="input-headline" />
                    </FormControl>
                    <FormDescription>A brief professional title</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About Me</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Tell employers about yourself..." rows={4} data-testid="input-bio" />
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
                          <Input {...field} placeholder="City, Country" className="pl-10" data-testid="input-location" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Philippines)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input {...field} placeholder="+63 912-345-6789" className="pl-10" data-testid="input-phone" />
                        </div>
                      </FormControl>
                      <FormDescription>Enter a valid Philippine mobile number</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="linkedinUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn Profile</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Linkedin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input {...field} placeholder="https://linkedin.com/in/..." className="pl-10" data-testid="input-linkedin" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="portfolioUrl"
                  render={({ field}) => (
                    <FormItem>
                      <FormLabel>Portfolio/Website</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input {...field} placeholder="https://yourwebsite.com" className="pl-10" data-testid="input-portfolio" />
                        </div>
                      </FormControl>
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
                    <FormLabel>Skills</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-skills" />
                    </FormControl>
                    <FormDescription>Separate skills with commas</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Categories</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={categoryOptions}
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder="Select your preferred job categories..."
                      />
                    </FormControl>
                    <FormDescription>Select categories you're interested in working in</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={updateProfileMutation.isPending} data-testid="button-save-profile">
                {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Work Experience */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Work Experience
              </CardTitle>
              <CardDescription>Your employment history</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWorkExpForm(!showWorkExpForm)}
              data-testid="button-add-work-exp"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Experience
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showWorkExpForm && (
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <Form {...workExpForm}>
                  <form onSubmit={workExpForm.handleSubmit((data) => addWorkExpMutation.mutate(data))} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={workExpForm.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-company" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={workExpForm.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Position</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-position" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={workExpForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-work-location" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={workExpForm.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <PhilippineDatePicker
                                value={field.value}
                                onChange={field.onChange}
                                mode="month-year"
                                placeholder="Select start date"
                                testId="input-start-date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={workExpForm.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date (Optional)</FormLabel>
                            <FormControl>
                              <PhilippineDatePicker
                                value={field.value || ""}
                                onChange={field.onChange}
                                mode="month-year"
                                placeholder="Select end date or leave blank"
                                testId="input-end-date"
                              />
                            </FormControl>
                            <FormDescription>Leave blank if currently working here</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={workExpForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="input-work-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button type="submit" disabled={addWorkExpMutation.isPending} data-testid="button-save-work-exp">
                        {addWorkExpMutation.isPending ? "Adding..." : "Add"}
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setShowWorkExpForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {profile?.workExperience && profile.workExperience.length > 0 ? (
            <div className="space-y-4">
              {profile.workExperience.map((exp: WorkExperience) => (
                <Card key={exp.id} data-testid={`work-exp-${exp.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{exp.position}</CardTitle>
                        <CardDescription>{exp.companyName} • {exp.location}</CardDescription>
                        <p className="text-sm text-muted-foreground mt-1">
                          {exp.startDate} - {exp.endDate || "Present"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteWorkExpMutation.mutate(exp.id)}
                        disabled={deleteWorkExpMutation.isPending}
                        data-testid={`button-delete-work-${exp.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {exp.description && (
                      <p className="text-sm mt-2">{exp.description}</p>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : !showWorkExpForm && (
            <p className="text-sm text-muted-foreground text-center py-8">No work experience added yet</p>
          )}
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Education
              </CardTitle>
              <CardDescription>Your academic background</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEducationForm(!showEducationForm)}
              data-testid="button-add-education"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Education
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showEducationForm && (
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <Form {...educationForm}>
                  <form onSubmit={educationForm.handleSubmit((data) => addEducationMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={educationForm.control}
                      name="institution"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Institution</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-institution" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={educationForm.control}
                        name="degree"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Degree</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g. Bachelor's" data-testid="input-degree" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={educationForm.control}
                        name="fieldOfStudy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Field of Study</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g. Computer Science" data-testid="input-field" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={educationForm.control}
                        name="startYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Year</FormLabel>
                            <FormControl>
                              <PhilippineDatePicker
                                value={field.value}
                                onChange={field.onChange}
                                mode="year"
                                placeholder="Select start year"
                                testId="input-start-year"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={educationForm.control}
                        name="endYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Year (Optional)</FormLabel>
                            <FormControl>
                              <PhilippineDatePicker
                                value={field.value || ""}
                                onChange={field.onChange}
                                mode="year"
                                placeholder="Select end year or leave blank"
                                testId="input-end-year"
                              />
                            </FormControl>
                            <FormDescription>Leave blank if currently enrolled</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={educationForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={2} data-testid="input-edu-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button type="submit" disabled={addEducationMutation.isPending} data-testid="button-save-education">
                        {addEducationMutation.isPending ? "Adding..." : "Add"}
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setShowEducationForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {profile?.education && profile.education.length > 0 ? (
            <div className="space-y-4">
              {profile.education.map((edu: Education) => (
                <Card key={edu.id} data-testid={`education-${edu.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{edu.degree} in {edu.fieldOfStudy}</CardTitle>
                        <CardDescription>{edu.institution}</CardDescription>
                        <p className="text-sm text-muted-foreground mt-1">
                          {edu.startYear} - {edu.endYear || "Present"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEducationMutation.mutate(edu.id)}
                        disabled={deleteEducationMutation.isPending}
                        data-testid={`button-delete-edu-${edu.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {edu.description && (
                      <p className="text-sm mt-2">{edu.description}</p>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : !showEducationForm && (
            <p className="text-sm text-muted-foreground text-center py-8">No education added yet</p>
          )}
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certifications
              </CardTitle>
              <CardDescription>Your professional certifications</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCertForm(!showCertForm)}
              data-testid="button-add-certification"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Certification
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showCertForm && (
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <Form {...certForm}>
                  <form onSubmit={certForm.handleSubmit((data) => addCertificationMutation.mutate(data))} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={certForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Certificate Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-cert-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={certForm.control}
                        name="issuer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Issuing Organization</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-issuer" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={certForm.control}
                        name="issueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Issue Date (Optional)</FormLabel>
                            <FormControl>
                              <PhilippineDatePicker
                                value={field.value || ""}
                                onChange={field.onChange}
                                mode="month-year"
                                placeholder="Select issue date"
                                testId="input-issue-date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={certForm.control}
                        name="expiryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Date (Optional)</FormLabel>
                            <FormControl>
                              <PhilippineDatePicker
                                value={field.value || ""}
                                onChange={field.onChange}
                                mode="month-year"
                                placeholder="Select expiry date or leave blank"
                                testId="input-expiry-date"
                              />
                            </FormControl>
                            <FormDescription>Leave blank if no expiration</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={certForm.control}
                      name="credentialUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credential URL</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://..." data-testid="input-credential-url" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button type="submit" disabled={addCertificationMutation.isPending} data-testid="button-save-cert">
                        {addCertificationMutation.isPending ? "Adding..." : "Add"}
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setShowCertForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {profile?.certifications && profile.certifications.length > 0 ? (
            <div className="space-y-4">
              {profile.certifications.map((cert: Certification) => (
                <Card key={cert.id} data-testid={`cert-${cert.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{cert.name}</CardTitle>
                        <CardDescription>{cert.issuer}</CardDescription>
                        <p className="text-sm text-muted-foreground mt-1">
                          Issued: {cert.issueDate || "N/A"}
                          {cert.expiryDate && ` • Expires: ${cert.expiryDate}`}
                        </p>
                        {cert.credentialUrl && (
                          <a 
                            href={cert.credentialUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sm text-primary hover:underline mt-1 inline-block"
                          >
                            View Credential →
                          </a>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCertificationMutation.mutate(cert.id)}
                        disabled={deleteCertificationMutation.isPending}
                        data-testid={`button-delete-cert-${cert.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : !showCertForm && (
            <p className="text-sm text-muted-foreground text-center py-8">No certifications added yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
