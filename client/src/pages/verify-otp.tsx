import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, setAuthToken } from "@/lib/queryClient";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Mail, RefreshCw, CheckCircle } from "lucide-react";

export default function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    const savedEmail = sessionStorage.getItem("pendingVerificationEmail");
    if (!savedEmail) {
      setLocation("/register");
      return;
    }
    setEmail(savedEmail);
  }, [setLocation]);

  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/verify-otp", { email, otp });
      return await response.json();
    },
    onSuccess: async (data: any) => {
      sessionStorage.removeItem("pendingVerificationEmail");
      
      // Store JWT token for subsequent requests
      if (data.token) {
        setAuthToken(data.token);
      }
      
      // Invalidate the auth query to refetch user data with new token
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      toast({
        title: "Email verified!",
        description: "Welcome to ZambaJobs",
      });
      
      // Redirect based on user role
      const role = data.user?.role;
      if (role === "job_seeker") {
        setLocation("/dashboard");
      } else if (role === "employer") {
        setLocation("/employer/dashboard");
      } else if (role === "admin") {
        setLocation("/admin/dashboard");
      } else {
        setLocation("/dashboard"); // Default fallback
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/resend-otp", { email });
      return await response.json();
    },
    onSuccess: () => {
      setCanResend(false);
      setCountdown(60);
      toast({
        title: "Code resent",
        description: "Check your email for a new verification code",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to resend",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOtpChange = (value: string) => {
    setOtp(value);
    if (value.length === 6) {
      verifyMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a 6-digit code to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <InputOTP 
              maxLength={6} 
              value={otp} 
              onChange={handleOtpChange}
              data-testid="input-otp"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            {verifyMutation.isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Verifying...</span>
              </div>
            )}

            {verifyMutation.isSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Verified successfully!</span>
              </div>
            )}
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Didn't receive the code?</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => resendMutation.mutate()}
              disabled={!canResend || resendMutation.isPending}
              data-testid="button-resend-otp"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${resendMutation.isPending ? 'animate-spin' : ''}`} />
              {canResend ? "Resend Code" : `Resend in ${countdown}s`}
            </Button>
          </div>

          <div className="pt-4 border-t text-center text-sm text-muted-foreground">
            <p>Need help? Contact support@zambajobs.digital</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
