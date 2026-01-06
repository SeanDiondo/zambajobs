import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Briefcase, User } from "lucide-react";

export default function Onboarding() {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();

  // Redirect if already has role
  useEffect(() => {
    if (!authLoading && user && user.role) {
      if (user.role === "employer") {
        setLocation("/employer/dashboard");
      } else if (user.role === "admin") {
        setLocation("/admin/dashboard");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [authLoading, user, setLocation]);

  const completeMutation = useMutation({
    mutationFn: async (role: string) => {
      const response = await apiRequest("POST", "/api/auth/complete-onboarding", { role });
      return await response.json();
    },
    onSuccess: async (data) => {
      // Refetch auth data - the useEffect will handle redirect
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Welcome to ZambaJobs!",
        description: "Your account is ready to use.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!selectedRole) {
      toast({
        title: "Role required",
        description: "Please select a role to continue",
        variant: "destructive",
      });
      return;
    }
    completeMutation.mutate(selectedRole);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            Choose how you'll use ZambaJobs to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedRole} onValueChange={setSelectedRole}>
            <div className="space-y-4">
              <Label
                htmlFor="job_seeker"
                className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover-elevate active-elevate-2"
                data-testid="label-role-job-seeker"
              >
                <RadioGroupItem value="job_seeker" id="job_seeker" data-testid="radio-job-seeker" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-semibold">
                    <User className="w-5 h-5" />
                    <span>Job Seeker</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Find jobs, apply to positions, and manage your career
                  </p>
                </div>
              </Label>

              <Label
                htmlFor="employer"
                className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover-elevate active-elevate-2"
                data-testid="label-role-employer"
              >
                <RadioGroupItem value="employer" id="employer" data-testid="radio-employer" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-semibold">
                    <Briefcase className="w-5 h-5" />
                    <span>Employer</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Post jobs, find candidates, and grow your team
                  </p>
                </div>
              </Label>
            </div>
          </RadioGroup>

          <Button
            className="w-full mt-6"
            onClick={handleSubmit}
            disabled={!selectedRole || completeMutation.isPending}
            data-testid="button-complete-onboarding"
          >
            {completeMutation.isPending ? "Setting up..." : "Continue"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
