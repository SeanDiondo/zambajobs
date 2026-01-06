import { useLocation } from "wouter";
import {
  Briefcase,
  LayoutDashboard,
  Search,
  FileText,
  Users,
  Shield,
  Settings,
  LogOut,
  User,
  Building2,
  AlertTriangle,
  BarChart3,
  Mail,
  UserCog,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { queryClient } from "@/lib/queryClient";

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      
      if (response.ok) {
        // Clear all cached queries to remove any user-specific data
        queryClient.clear();
        
        // Replace current history entry to prevent back button from showing cached pages
        window.history.replaceState(null, '', '/');
        
        // Navigate to landing page
        setLocation("/");
        
        // Force a page reload to ensure clean state
        window.location.href = '/';
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Don't render sidebar AT ALL until user is resolved
  if (!user) {
    return null;
  }

  const jobSeekerItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Find Jobs",
      url: "/jobs",
      icon: Search,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: BarChart3,
    },
    {
      title: "Contact Support",
      url: "/contact",
      icon: Mail,
    },
  ];

  const employerItems = [
    {
      title: "Dashboard",
      url: "/employer/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Analytics",
      url: "/employer/analytics",
      icon: BarChart3,
    },
    {
      title: "Contact Support",
      url: "/employer/contact",
      icon: Mail,
    },
  ];

  const adminItems = [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Fraud Detection",
      url: "/admin/fraud",
      icon: AlertTriangle,
    },
    {
      title: "User Management",
      url: "/admin/users",
      icon: Users,
    },
    {
      title: "Job Management",
      url: "/admin/jobs",
      icon: Briefcase,
    },
    {
      title: "Contact Messages",
      url: "/admin/contacts",
      icon: Mail,
    },
    {
      title: "Report Analytics",
      url: "/admin/analytics",
      icon: BarChart3,
    },
    {
      title: "Admin Management",
      url: "/admin/admins",
      icon: UserCog,
    },
  ];

  const getMenuItems = () => {
    if (!user) {
      return [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
      ];
    }
    switch (user.role) {
      case "job_seeker":
        return jobSeekerItems;
      case "employer":
        return employerItems;
      case "admin":
        return adminItems;
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const getDashboardUrl = () => {
    switch (user.role) {
      case "job_seeker":
        return "/dashboard";
      case "employer":
        return "/employer/dashboard";
      case "admin":
        return "/admin/dashboard";
      default:
        return "/";
    }
  };

  return (
    <Sidebar collapsible="icon" data-testid="app-sidebar">
      <SidebarHeader className="border-b p-4">
        <button
          onClick={() => setLocation(getDashboardUrl())}
          className="flex items-center gap-2 hover-elevate rounded-md p-2 -m-2 w-full text-left"
          data-testid="logo-button"
        >
          <Briefcase className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold group-data-[collapsible=icon]:hidden">
            ZambaJobs
          </span>
        </button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => setLocation(item.url)}
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} data-testid="nav-logout">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="group-data-[collapsible=icon]:hidden">
          <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground capitalize mt-1">
            {user.role?.replace('_', ' ')}
          </p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
