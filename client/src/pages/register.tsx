import { Link, useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Mail, Lock, User, Chrome, UserCircle, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  role: z.enum(["job_seeker", "employer"]),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms to continue",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const JOB_SEEKER_AGREEMENT = `ZambaJobs Job Seeker Sign-Up Agreement

By creating a Job Seeker account on ZambaJobs, you agree to provide true and accurate personal information, including genuine educational, employment, and identification documents, and to use your real identity without impersonation. Any false or misleading information may result in account suspension or deletion. You also agree to conduct yourself responsibly on the platform by avoiding the upload of falsified documents, refraining from harassment, and not applying to job posts with fraudulent intent or using the platform for illegal, harmful, or inappropriate purposes.

You understand that ZambaJobs may request additional documents for verification and that any files you upload may undergo automated and manual fraud checks. Your account may be restricted until verification is completed. As a Job Seeker, you agree to communicate professionally with employers, avoid scams, offensive messages, and spam, and comply with employer requirements during the hiring process.

You are responsible for keeping your login credentials secure, reporting any suspicious activity immediately, and ensuring that your device is safe and protected while accessing your account. You acknowledge that ZambaJobs does not guarantee employment, that employers make the final hiring decisions, and that you should always use your own judgment when interacting with employers.

By signing up, you confirm that you understand and accept this Job Seeker Agreement and agree to abide by the ZambaJobs Terms of Service and Privacy Policy.`;

const EMPLOYER_AGREEMENT = `ZambaJobs Employer Sign-Up Agreement

By creating an Employer account on ZambaJobs, you agree to provide accurate and truthful company information, including valid business details, contact information, and official credentials. You also commit to uploading legitimate company documents required for verification. Any form of misrepresentation, including falsified documents or deceptive company information, may result in account suspension or removal from the platform.

As an Employer, you agree to post only legitimate and clearly described job openings that provide truthful details such as job responsibilities, salary ranges (if applicable), and job locations. You further agree not to post misleading, inappropriate, illegal, or scam-related job listings. ZambaJobs reserves the right to review, edit, or remove job posts that violate platform guidelines.

You understand that ZambaJobs may require additional documentation to verify your company's authenticity and that your uploaded documents may undergo automated and manual fraud checks. Your account may be limited, restricted, or disabled if verification fails or appears suspicious.

You agree to communicate professionally with job seekers and avoid collecting unnecessary or overly sensitive personal information. You also agree not to subject applicants to unsafe, deceptive, or discriminatory hiring practices. Any form of harassment, exploitation, or scam-related behavior may result in the permanent removal of your employer account.

You are responsible for securing your login credentials, ensuring that only authorized personnel have access to your account, and reporting any suspicious user activity or fraudulent applicants to ZambaJobs immediately. You acknowledge that ZambaJobs is not liable for your hiring decisions and that all agreements or arrangements made between you and job seekers are solely your responsibility.

By signing up, you confirm that you understand and accept this Employer Agreement and agree to comply with all ZambaJobs platform rules, Terms of Service, and Privacy Policy.`;

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const { toast } = useToast();
  const [agreementDialogOpen, setAgreementDialogOpen] = useState(false);
  
  const urlParams = new URLSearchParams(searchParams);
  const roleFromUrl = urlParams.get("role") as "job_seeker" | "employer" | null;
  const emailFromUrl = urlParams.get("email") || "";
  const firstNameFromUrl = urlParams.get("firstName") || "";
  const lastNameFromUrl = urlParams.get("lastName") || "";
  const fromGoogle = urlParams.get("fromGoogle") === "true";

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: firstNameFromUrl,
      lastName: lastNameFromUrl,
      email: emailFromUrl,
      password: "",
      confirmPassword: "",
      role: roleFromUrl || "job_seeker",
      agreeToTerms: false,
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const { confirmPassword, ...registerData } = data;
      const response = await apiRequest("POST", "/api/auth/register", registerData);
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.requiresOTP && data.email) {
        sessionStorage.setItem("pendingVerificationEmail", data.email);
        toast({
          title: "Account created!",
          description: "Please check your email for your verification code.",
        });
        setLocation("/verify-otp");
      } else {
        toast({
          title: "Account created!",
          description: "Please check your email.",
        });
        setLocation("/login");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  const handleGoogleSignup = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            {fromGoogle ? "Complete your registration to continue" : "Join ZambaJobs and start your journey"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignup}
            data-testid="button-google-signup"
          >
            <Chrome className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            {...field}
                            placeholder="John"
                            className="pl-10"
                            data-testid="input-first-name"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Doe"
                          data-testid="input-last-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="you@example.com"
                          className="pl-10"
                          data-testid="input-email"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am a</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-role">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="job_seeker" data-testid="option-job-seeker">
                          <div className="flex items-center gap-2">
                            <UserCircle className="h-4 w-4" />
                            Job Seeker
                          </div>
                        </SelectItem>
                        <SelectItem value="employer" data-testid="option-employer">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            Employer
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          data-testid="input-password"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          data-testid="input-confirm-password"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agreeToTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-agree-terms"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        I agree to the{" "}
                        <Dialog open={agreementDialogOpen} onOpenChange={setAgreementDialogOpen}>
                          <DialogTrigger asChild>
                            <button
                              className="text-sm font-normal text-primary underline hover:text-primary/80 cursor-pointer bg-transparent border-none p-0"
                              type="button"
                              data-testid="link-view-agreement"
                            >
                              {form.watch("role") === "employer" ? "Employer" : "Job Seeker"} Sign-Up Agreement
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle>
                                <div className="flex items-center gap-2">
                                  <FileText className="h-5 w-5" />
                                  {form.watch("role") === "employer" ? "Employer" : "Job Seeker"} Sign-Up Agreement
                                </div>
                              </DialogTitle>
                              <DialogDescription>
                                Please read and understand the terms before proceeding
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="h-[50vh] pr-4">
                              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                {form.watch("role") === "employer" ? EMPLOYER_AGREEMENT : JOB_SEEKER_AGREEMENT}
                              </div>
                            </ScrollArea>
                            <div className="flex justify-end gap-2 pt-4 border-t">
                              <Button
                                variant="outline"
                                onClick={() => setAgreementDialogOpen(false)}
                                data-testid="button-close-agreement"
                              >
                                Close
                              </Button>
                              <Button
                                onClick={() => {
                                  form.setValue("agreeToTerms", true);
                                  setAgreementDialogOpen(false);
                                }}
                                data-testid="button-accept-agreement"
                              >
                                I Accept
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending}
                data-testid="button-submit-register"
              >
                {registerMutation.isPending ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login">
              <Button variant="ghost" className="px-1" data-testid="link-login">
                Log in
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
