import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Shield, AlertTriangle, Users, FileText, TrendingUp, Search, Flag, RefreshCcw, Mail, BarChart3, MessageSquare, Eye, MapPin, Building2, Phone, Linkedin, DollarSign, Calendar } from "lucide-react";
import type { FraudAlert, User, Job, ActivityLog } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistance } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [userSearch, setUserSearch] = useState("");
  const [viewingDetails, setViewingDetails] = useState<any>(null);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const { data: fraudAlerts, isLoading: alertsLoading } = useQuery<FraudAlert[]>({
    queryKey: ["/api/admin/fraud-alerts"],
  });

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: activityLogs, isLoading: activityLoading, isError: activityError } = useQuery<ActivityLog[]>({
    queryKey: ["/api/admin/activity"],
  });

  const reviewAlertMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      return await apiRequest("PUT", `/api/admin/fraud-alerts/${id}`, { status, reviewNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fraud-alerts"] });
      toast({
        title: "Alert updated",
        description: "The fraud alert has been reviewed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update alert",
        variant: "destructive",
      });
    },
  });

  const flagUserMutation = useMutation({
    mutationFn: async ({ userId, isFlagged }: { userId: string; isFlagged: boolean }) => {
      return await apiRequest("PUT", `/api/admin/users/${userId}/flag`, { isFlagged });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User updated", description: "User flag status updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleViewDetails = async (alert: any) => {
    setViewingDetails(alert);
    setLoadingDetails(true);
    setDetailsData(null);
    
    try {
      const response = await fetch(`/api/admin/fraud-alerts/${alert.id}/details`);
      if (!response.ok) {
        throw new Error('Failed to fetch details');
      }
      const data = await response.json();
      setDetailsData(data.details);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load details", variant: "destructive" });
    } finally {
      setLoadingDetails(false);
    }
  };

  const pendingAlerts = fraudAlerts?.filter(a => a.status === "pending") || [];
  
  const filteredUsers = users?.filter(u => 
    !userSearch || 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor platform security and moderate content</p>
        </div>
        <Badge variant="destructive" className="gap-1">
          <Shield className="h-3 w-3" />
          Admin
        </Badge>
      </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card data-testid="card-stat-users">
            <CardHeader className="pb-3">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-3xl">{stats?.totalUsers || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>Platform members</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-total-jobs">
            <CardHeader className="pb-3">
              <CardDescription>Active Jobs</CardDescription>
              <CardTitle className="text-3xl">{stats?.activeJobs || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Briefcase className="h-3 w-3" />
                <span>Job postings</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-pending-alerts">
            <CardHeader className="pb-3">
              <CardDescription>Pending Alerts</CardDescription>
              <CardTitle className="text-3xl text-destructive">{pendingAlerts.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3" />
                <span>Needs review</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-flagged">
            <CardHeader className="pb-3">
              <CardDescription>Flagged Content</CardDescription>
              <CardTitle className="text-3xl">{stats?.flaggedContent || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                <span>Under review</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {/* Quick Actions */}
          <Card className="md:col-span-2" data-testid="card-quick-actions">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-2" asChild data-testid="button-view-contacts">
                  <Link href="/admin/contacts">
                    <Mail className="h-5 w-5" />
                    <span className="text-xs">Contact Messages</span>
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-2" asChild data-testid="button-view-analytics">
                  <Link href="/admin/analytics">
                    <BarChart3 className="h-5 w-5" />
                    <span className="text-xs">Analytics</span>
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-auto py-3 flex-col gap-2"
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/admin/fraud-alerts"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/admin/activity"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/admin/contacts"] });
                    toast({ title: "Refreshed", description: "Admin data has been refreshed" });
                  }}
                  data-testid="button-refresh-data"
                >
                  <RefreshCcw className="h-5 w-5" />
                  <span className="text-xs">Refresh Data</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card data-testid="card-recent-activity">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest platform events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {activityLoading ? (
                  <p className="text-sm text-muted-foreground">Loading activity...</p>
                ) : activityError ? (
                  <p className="text-sm text-destructive">Failed to load activity logs</p>
                ) : activityLogs && activityLogs.length > 0 ? (
                  activityLogs.slice(0, 8).map((log) => (
                    <div key={log.id} className="flex gap-2 text-sm" data-testid={`activity-log-${log.id}`}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm line-clamp-2">{log.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistance(new Date(log.createdAt), new Date(), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="alerts" data-testid="tab-alerts">
              Fraud Alerts
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              User Management
            </TabsTrigger>
            <TabsTrigger value="moderation" data-testid="tab-moderation">
              Content Moderation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-4 mt-6">
            {pendingAlerts.length > 0 ? (
              <div className="space-y-4">
                {pendingAlerts.map((alert) => (
                  <Card 
                    key={alert.id} 
                    className="hover-elevate border-destructive/50" 
                    data-testid={`card-alert-${alert.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{alert.alertType}</CardTitle>
                            <Badge 
                              variant={
                                alert.aiConfidence >= 80 ? "destructive" :
                                alert.aiConfidence >= 60 ? "default" :
                                "secondary"
                              }
                            >
                              {alert.aiConfidence}% Confidence
                            </Badge>
                            <Badge variant="outline">{alert.entityType}</Badge>
                          </div>
                          <CardDescription>
                            Detected {new Date(alert.createdAt).toLocaleString()}
                          </CardDescription>
                        </div>
                      </div>
                      <p className="text-sm mt-2">
                        {alert.description}
                      </p>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => reviewAlertMutation.mutate({ id: alert.id, status: "confirmed" })}
                        disabled={reviewAlertMutation.isPending}
                        data-testid={`button-confirm-${alert.id}`}
                      >
                        Confirm Fraud
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reviewAlertMutation.mutate({ id: alert.id, status: "dismissed" })}
                        disabled={reviewAlertMutation.isPending}
                        data-testid={`button-dismiss-${alert.id}`}
                      >
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewDetails(alert)}
                        data-testid={`button-view-details-${alert.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-8">
                <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No pending fraud alerts</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  All fraud alerts have been reviewed. The platform is secure!
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4 mt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by email or role..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-user-search"
                />
              </div>
              <Badge variant="outline">{filteredUsers.length} users</Badge>
            </div>

            {usersLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading users...</div>
            ) : filteredUsers.length > 0 ? (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <Card key={user.id} className="hover-elevate" data-testid={`card-user-${user.id}`}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{user.email}</p>
                          <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'employer' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                          {user.isFlagged && (
                            <Badge variant="destructive" className="gap-1">
                              <Flag className="h-3 w-3" />
                              Flagged
                            </Badge>
                          )}
                          {!user.emailVerified && (
                            <Badge variant="outline">Unverified</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                          {user.role === 'job_seeker' && user.applicationCount !== undefined && (
                            <span>{user.applicationCount} applications</span>
                          )}
                          {user.role === 'employer' && user.jobCount !== undefined && (
                            <span>{user.jobCount} jobs posted</span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={user.isFlagged ? "default" : "destructive"}
                        onClick={() => flagUserMutation.mutate({ userId: user.id, isFlagged: !user.isFlagged })}
                        disabled={flagUserMutation.isPending || user.role === 'admin'}
                        data-testid={`button-flag-${user.id}`}
                      >
                        {user.isFlagged ? 'Unflag' : 'Flag'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-8">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No users found</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Try adjusting your search criteria
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="moderation" className="space-y-4 mt-6">
            <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-8">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Content moderation queue</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Review flagged users, jobs, and other content here
              </p>
            </div>
          </TabsContent>
        </Tabs>

      {/* Details Dialog */}
      <Dialog open={!!viewingDetails} onOpenChange={() => setViewingDetails(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Alert Details</DialogTitle>
            <DialogDescription>
              {viewingDetails?.entityType === 'user' ? 'User Profile Information' : 'Job Posting Information'}
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="py-8 text-center text-muted-foreground">Loading details...</div>
          ) : !detailsData ? (
            <div className="py-8 text-center text-destructive">Entity not found or has been deleted</div>
          ) : viewingDetails?.entityType === 'user' ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">User Information</h3>
                <div className="grid gap-2 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="col-span-2">{detailsData.email}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground">Role:</span>
                    <span className="col-span-2">
                      <Badge>{detailsData.role}</Badge>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground">Joined:</span>
                    <span className="col-span-2">{new Date(detailsData.createdAt).toLocaleDateString()}</span>
                  </div>
                  {detailsData.firstName && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="col-span-2">{detailsData.firstName} {detailsData.lastName}</span>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Profile Details</h3>
                <div className="grid gap-2 text-sm">
                  {detailsData.headline && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Headline:</span>
                      <span className="col-span-2">{detailsData.headline}</span>
                    </div>
                  )}
                  {detailsData.bio && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Bio:</span>
                      <span className="col-span-2">{detailsData.bio}</span>
                    </div>
                  )}
                  {detailsData.location && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="col-span-2">{detailsData.location}</span>
                    </div>
                  )}
                  {detailsData.skills && detailsData.skills.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Skills:</span>
                      <div className="col-span-2 flex flex-wrap gap-1">
                        {detailsData.skills.map((skill: string, idx: number) => (
                          <Badge key={idx} variant="outline">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Job Information</h3>
                <div className="grid gap-2 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground">Title:</span>
                    <span className="col-span-2 font-medium">{detailsData.title}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground">Company:</span>
                    <span className="col-span-2">{detailsData.companyName}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="col-span-2">{detailsData.location}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground">Job Type:</span>
                    <span className="col-span-2">
                      <Badge variant="outline">{detailsData.jobType?.replace('_', ' ')}</Badge>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="col-span-2">
                      <Badge variant={detailsData.status === 'active' ? 'default' : 'secondary'}>{detailsData.status}</Badge>
                    </span>
                  </div>
                  {(detailsData.salaryMin || detailsData.salaryMax) && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Salary:</span>
                      <span className="col-span-2">
                        {detailsData.salaryMin && detailsData.salaryMax
                          ? `₱${detailsData.salaryMin?.toLocaleString()} - ₱${detailsData.salaryMax?.toLocaleString()}`
                          : detailsData.salaryMin 
                          ? `₱${detailsData.salaryMin?.toLocaleString()}+`
                          : `Up to ₱${detailsData.salaryMax?.toLocaleString()}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailsData.description}</p>
              </div>
              {detailsData.requirements && detailsData.requirements.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Requirements</h3>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {detailsData.requirements.map((req: string, idx: number) => (
                        <li key={idx}>{req}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
              {detailsData.skills && detailsData.skills.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Required Skills</h3>
                    <div className="flex flex-wrap gap-1">
                      {detailsData.skills.map((skill: string, idx: number) => (
                        <Badge key={idx} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
