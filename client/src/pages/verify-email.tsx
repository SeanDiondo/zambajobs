import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function VerifyEmail() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link - no token provided');
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
          // Refresh auth context in case user is logged in
          queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during verification');
        console.error('Verification error:', error);
      }
    };

    verifyEmail();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
              <Loader2 className="h-16 w-16 text-primary animate-spin" data-testid="loader-verification" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-16 w-16 text-green-600" data-testid="icon-success" />
            )}
            {status === 'error' && (
              <XCircle className="h-16 w-16 text-destructive" data-testid="icon-error" />
            )}
          </div>
          <CardTitle data-testid="title-verification">
            {status === 'loading' && 'Verifying Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription data-testid="text-message">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <Button
              onClick={() => navigate('/login')}
              className="w-full"
              data-testid="button-login"
            >
              Go to Login
            </Button>
          )}
          {status === 'error' && (
            <div className="space-y-2">
              <Button
                onClick={() => navigate('/login')}
                className="w-full"
                data-testid="button-back-to-login"
              >
                Back to Login
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Need help? Contact support or try registering again.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
