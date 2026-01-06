import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, TrendingUp, Target, BarChart3 } from "lucide-react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function JobSeekerAnalytics() {
  const { data: analytics, isLoading } = useQuery<any>({
    queryKey: ["/api/analytics/job-seeker"],
  });

  const exportToCSV = () => {
    if (!analytics) return;

    const csvData: string[] = [];
    
    csvData.push("Job Seeker Analytics Report");
    csvData.push("");
    csvData.push("Overview");
    csvData.push("Metric,Value");
    csvData.push(`Total Applications,${analytics.overview.totalApplications}`);
    csvData.push(`Average Match Score,${analytics.overview.avgMatchScore}%`);
    csvData.push(`Response Rate,${analytics.overview.responseRate}%`);
    csvData.push("");

    csvData.push("Application Status");
    csvData.push("Status,Count");
    Object.entries(analytics.breakdown.applicationsByStatus).forEach(([status, count]) => {
      csvData.push(`${status},${count}`);
    });
    csvData.push("");

    csvData.push("Top Applications");
    csvData.push("Job Title,Company,Match Score,Status,Applied At");
    analytics.breakdown.topApplications.forEach((app: any) => {
      csvData.push(`${app.jobTitle},${app.company},${app.matchScore}%,${app.status},${new Date(app.appliedAt).toLocaleDateString()}`);
    });
    csvData.push("");

    const blob = new Blob([csvData.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-seeker-analytics-${new Date().toISOString().split('T')[0]}.csv`;
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

  const applicationStatusData = Object.entries(analytics.breakdown.applicationsByStatus).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: value as number
  }));

  const matchScoreData = Object.entries(analytics.breakdown.matchScoreRanges).map(([name, value]) => ({
    name,
    value: value as number
  }));

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Application Analytics</h1>
            <p className="text-muted-foreground">Track your job search progress</p>
          </div>
          <Button onClick={exportToCSV} data-testid="button-export-csv">
            <Download className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card data-testid="card-stat-applications">
            <CardHeader className="pb-3">
              <CardDescription>Total Applications</CardDescription>
              <CardTitle className="text-3xl">{analytics.overview.totalApplications}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" />
                <span>Submitted</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-match-score">
            <CardHeader className="pb-3">
              <CardDescription>Avg Match Score</CardDescription>
              <CardTitle className="text-3xl">{analytics.overview.avgMatchScore}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Target className="h-3 w-3" />
                <span>AI-calculated</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-response-rate">
            <CardHeader className="pb-3">
              <CardDescription>Response Rate</CardDescription>
              <CardTitle className="text-3xl">{analytics.overview.responseRate}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>Reviewed/Responded</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <Card data-testid="card-application-trend" className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Applications Sent</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.trends.applications}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                  <YAxis className="text-xs" />
                  <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} name="Applications" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card data-testid="card-applications-by-status">
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={applicationStatusData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={90} fill="#8884d8" dataKey="value">
                    {applicationStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card data-testid="card-match-score-distribution">
            <CardHeader>
              <CardTitle>Match Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={matchScoreData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={90} fill="#8884d8" dataKey="value">
                    {matchScoreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-top-applications">
          <CardHeader>
            <CardTitle>Your Best Matches</CardTitle>
            <CardDescription>Top 10 applications by match score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.breakdown.topApplications.map((app: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-md hover-elevate" data-testid={`application-${index}`}>
                  <div className="flex-1">
                    <h4 className="font-semibold">{app.jobTitle}</h4>
                    <p className="text-sm text-muted-foreground">{app.company}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Applied {new Date(app.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{app.matchScore}%</div>
                      <div className="text-xs text-muted-foreground">Match</div>
                    </div>
                    <Badge variant={
                      app.status === 'accepted' ? 'default' : 
                      app.status === 'rejected' ? 'destructive' : 
                      'secondary'
                    }>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
