import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, Users, Briefcase, FileText, AlertTriangle } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export default function AdminAnalytics() {
  const { data: analytics, isLoading } = useQuery<any>({
    queryKey: ["/api/analytics/admin"],
  });

  const exportToCSV = () => {
    if (!analytics) return;

    const csvData: string[] = [];
    
    // Overview section
    csvData.push("Admin Analytics Report");
    csvData.push("");
    csvData.push("Overview");
    csvData.push("Metric,Value");
    csvData.push(`Total Users,${analytics.overview.totalUsers}`);
    csvData.push(`Total Jobs,${analytics.overview.totalJobs}`);
    csvData.push(`Total Applications,${analytics.overview.totalApplications}`);
    csvData.push(`Total Fraud Alerts,${analytics.overview.totalFraudAlerts}`);
    csvData.push(`Active Jobs,${analytics.overview.activeJobs}`);
    csvData.push(`Flagged Users,${analytics.overview.flaggedUsers}`);
    csvData.push(`Verified Users,${analytics.overview.verifiedUsers}`);
    csvData.push("");

    // Users by role
    csvData.push("Users by Role");
    csvData.push("Role,Count");
    csvData.push(`Job Seekers,${analytics.breakdown.usersByRole.job_seeker}`);
    csvData.push(`Employers,${analytics.breakdown.usersByRole.employer}`);
    csvData.push(`Admins,${analytics.breakdown.usersByRole.admin}`);
    csvData.push("");

    // Application status
    csvData.push("Applications by Status");
    csvData.push("Status,Count");
    Object.entries(analytics.breakdown.applicationsByStatus).forEach(([status, count]) => {
      csvData.push(`${status},${count}`);
    });
    csvData.push("");

    // User trend
    csvData.push("User Registrations (Last 30 Days)");
    csvData.push("Date,Count");
    analytics.trends.users.forEach((item: any) => {
      csvData.push(`${item.date},${item.count}`);
    });
    csvData.push("");

    // Download
    const blob = new Blob([csvData.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background p-8">
        <p className="text-center text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  // Prepare data for pie charts
  const userRoleData = [
    { name: 'Job Seekers', value: analytics.breakdown.usersByRole.job_seeker },
    { name: 'Employers', value: analytics.breakdown.usersByRole.employer },
    { name: 'Admins', value: analytics.breakdown.usersByRole.admin }
  ];

  const applicationStatusData = Object.entries(analytics.breakdown.applicationsByStatus).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: value as number
  }));

  const fraudAlertStatusData = Object.entries(analytics.breakdown.fraudAlertsByStatus).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: value as number
  }));

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Platform-wide metrics and insights</p>
          </div>
          <Button onClick={exportToCSV} data-testid="button-export-csv">
            <Download className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card data-testid="card-stat-users">
            <CardHeader className="pb-3">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-3xl">{analytics.overview.totalUsers}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{analytics.overview.verifiedUsers} verified</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-jobs">
            <CardHeader className="pb-3">
              <CardDescription>Total Jobs</CardDescription>
              <CardTitle className="text-3xl">{analytics.overview.totalJobs}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Briefcase className="h-3 w-3" />
                <span>{analytics.overview.activeJobs} active</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-applications">
            <CardHeader className="pb-3">
              <CardDescription>Total Applications</CardDescription>
              <CardTitle className="text-3xl">{analytics.overview.totalApplications}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" />
                <span>All time</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-fraud">
            <CardHeader className="pb-3">
              <CardDescription>Fraud Alerts</CardDescription>
              <CardTitle className="text-3xl">{analytics.overview.totalFraudAlerts}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3" />
                <span>{analytics.overview.flaggedUsers} flagged users</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time-series Trends */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <Card data-testid="card-user-trend">
            <CardHeader>
              <CardTitle>User Registrations</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.trends.users}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                  <YAxis className="text-xs" />
                  <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} name="Users" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card data-testid="card-job-trend">
            <CardHeader>
              <CardTitle>Job Postings</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.trends.jobs}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                  <YAxis className="text-xs" />
                  <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Jobs" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card data-testid="card-application-trend" className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Applications Submitted</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.trends.applications}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                  <YAxis className="text-xs" />
                  <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Applications" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Breakdown Charts */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <Card data-testid="card-users-by-role">
            <CardHeader>
              <CardTitle>Users by Role</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={userRoleData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {userRoleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card data-testid="card-applications-by-status">
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={applicationStatusData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {applicationStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card data-testid="card-fraud-alerts-by-status">
            <CardHeader>
              <CardTitle>Fraud Alert Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={fraudAlertStatusData} cx="50%" cy="50%" labelLine={false} label={({ name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {fraudAlertStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Categories */}
        <Card data-testid="card-top-categories">
          <CardHeader>
            <CardTitle>Top Job Categories</CardTitle>
            <CardDescription>Most popular job categories on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={analytics.breakdown.topCategories}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="category" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Jobs" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
