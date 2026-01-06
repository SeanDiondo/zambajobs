import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import VerifyEmail from "@/pages/verify-email";
import VerifyOTP from "@/pages/verify-otp";
import Onboarding from "@/pages/onboarding";
import Profile from "@/pages/profile";
import Jobs from "@/pages/jobs";
import JobDetails from "@/pages/job-details";
import PostJob from "@/pages/post-job";
import JobManagement from "@/pages/job-management";
import ApplicantPortfolio from "@/pages/applicant-portfolio";
import JobSeekerDashboard from "@/pages/job-seeker-dashboard";
import EmployerDashboard from "@/pages/employer-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminContacts from "@/pages/admin-contacts";
import AdminAnalytics from "@/pages/admin-analytics";
import AdminUsers from "@/pages/admin-users";
import AdminJobs from "@/pages/admin-jobs";
import AdminManagement from "@/pages/admin-admins";
import AdminFraud from "@/pages/admin-fraud";
import EmployerAnalytics from "@/pages/employer-analytics";
import JobSeekerAnalytics from "@/pages/job-seeker-analytics";
import EmployerContact from "@/pages/employer-contact";
import JobSeekerContact from "@/pages/job-seeker-contact";

function getRoleDashboard(role: string): string {
  switch (role) {
    case "job_seeker":
      return "/dashboard";
    case "employer":
      return "/employer/dashboard";
    case "admin":
      return "/admin/dashboard";
    default:
      return "/";
  }
}

function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles?: string[];
}) {
  const { user, isLoading } = useAuth();

  // Don't render or redirect while loading
  if (isLoading || !user) {
    if (isLoading) {
      return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }
    return <Redirect to="/login" />;
  }

  // User is now guaranteed to be defined
  if (allowedRoles && user.role && !allowedRoles.includes(user.role)) {
    const correctDashboard = getRoleDashboard(user.role);
    return <Redirect to={correctDashboard} />;
  }

  return <>{children}</>;
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 overflow-hidden">
          <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background px-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-3 flex-1">
              <h1 className="text-lg font-semibold">ZambaJobs</h1>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/verify-otp" component={VerifyOTP} />
      <Route path="/jobs" component={Jobs} />
      <Route path="/jobs/:id" component={JobDetails} />
      <Route path="/profile">
        <ProtectedRoute allowedRoles={["job_seeker", "employer"]}>
          <DashboardLayout>
            <Profile />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute allowedRoles={["job_seeker"]}>
          <DashboardLayout>
            <JobSeekerDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/employer/dashboard">
        <ProtectedRoute allowedRoles={["employer"]}>
          <DashboardLayout>
            <EmployerDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/employer/post-job">
        <ProtectedRoute allowedRoles={["employer"]}>
          <DashboardLayout>
            <PostJob />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/employer/jobs/:id">
        <ProtectedRoute allowedRoles={["employer"]}>
          <DashboardLayout>
            <JobManagement />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/employer/applicant/:userId">
        <ProtectedRoute allowedRoles={["employer"]}>
          <DashboardLayout>
            <ApplicantPortfolio />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/employer/analytics">
        <ProtectedRoute allowedRoles={["employer"]}>
          <DashboardLayout>
            <EmployerAnalytics />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/employer/contact">
        <ProtectedRoute allowedRoles={["employer"]}>
          <DashboardLayout>
            <EmployerContact />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/analytics">
        <ProtectedRoute allowedRoles={["job_seeker"]}>
          <DashboardLayout>
            <JobSeekerAnalytics />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/contact">
        <ProtectedRoute allowedRoles={["job_seeker"]}>
          <DashboardLayout>
            <JobSeekerContact />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/dashboard">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/contacts">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminContacts />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/analytics">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminAnalytics />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/fraud">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminFraud />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminUsers />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/jobs">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminJobs />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/admins">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminManagement />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
