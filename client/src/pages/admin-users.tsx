import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Flag, CheckCircle, XCircle, Shield, Trash2, UserPlus, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const USERS_PER_PAGE = 10;

export default function AdminUsers() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [createAdminDialogOpen, setCreateAdminDialogOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  const { data: users, isLoading, isError } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  const flagUserMutation = useMutation({
    mutationFn: async ({ id, isFlagged }: { id: string; isFlagged: boolean }) => {
      return await apiRequest("PUT", `/api/admin/users/${id}/flag`, { isFlagged });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Success", description: "User status updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/users/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Success", description: "User deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete user", 
        variant: "destructive" 
      });
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: async (data: typeof newAdmin) => {
      return await apiRequest("POST", "/api/admin/users/admin", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setCreateAdminDialogOpen(false);
      setNewAdmin({ email: "", password: "", firstName: "", lastName: "" });
      toast({ title: "Success", description: "Admin account created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create admin account", 
        variant: "destructive" 
      });
    },
  });

  const filteredUsers = users?.filter(u =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const endIndex = startIndex + USERS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">Manage all platform users</p>
        </div>
        <Dialog open={createAdminDialogOpen} onOpenChange={setCreateAdminDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-admin">
              <UserPlus className="h-4 w-4 mr-2" />
              Create Admin
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-create-admin">
            <DialogHeader>
              <DialogTitle>Create Admin Account</DialogTitle>
              <DialogDescription>
                Create a new administrator account with full platform access
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  data-testid="input-admin-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  data-testid="input-admin-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-first-name">First Name</Label>
                <Input
                  id="admin-first-name"
                  placeholder="John"
                  value={newAdmin.firstName}
                  onChange={(e) => setNewAdmin({ ...newAdmin, firstName: e.target.value })}
                  data-testid="input-admin-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-last-name">Last Name</Label>
                <Input
                  id="admin-last-name"
                  placeholder="Doe"
                  value={newAdmin.lastName}
                  onChange={(e) => setNewAdmin({ ...newAdmin, lastName: e.target.value })}
                  data-testid="input-admin-last-name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateAdminDialogOpen(false)}
                data-testid="button-cancel-admin"
              >
                Cancel
              </Button>
              <Button
                onClick={() => createAdminMutation.mutate(newAdmin)}
                disabled={createAdminMutation.isPending || !newAdmin.email || !newAdmin.password || !newAdmin.firstName || !newAdmin.lastName}
                data-testid="button-submit-admin"
              >
                {createAdminMutation.isPending ? "Creating..." : "Create Admin"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
          <CardDescription>Find users by name, email, or role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
              data-testid="input-search-users"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading users...
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="py-8 text-center text-destructive">
            Failed to load users
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Users ({filteredUsers.length})</CardTitle>
                <CardDescription>
                  {filteredUsers.length > 0 
                    ? `Showing ${startIndex + 1}-${Math.min(endIndex, filteredUsers.length)} of ${filteredUsers.length}`
                    : 'No users found'
                  }
                </CardDescription>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    data-testid="button-previous-page"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    data-testid="button-next-page"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paginatedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-md border hover-elevate"
                  data-testid={`user-row-${user.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="text-xs">
                        {user.role?.replace('_', ' ') || 'unknown'}
                      </Badge>
                      {user.isEmailVerified && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      {user.flagged && (
                        <Flag className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {user.totalApplications || 0} applications
                      </Badge>
                      {user.role === 'employer' && (
                        <Badge variant="outline" className="text-xs">
                          {user.totalJobs || 0} jobs
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" data-testid={`button-view-${user.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>User Details</DialogTitle>
                          <DialogDescription>
                            Complete information for {user.firstName} {user.lastName}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-semibold mb-1">Full Name</h4>
                              <p className="text-sm text-muted-foreground">{user.firstName} {user.lastName}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold mb-1">Email</h4>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold mb-1">Role</h4>
                              <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                                {user.role?.replace('_', ' ') || 'unknown'}
                              </Badge>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold mb-1">Email Verified</h4>
                              <div className="flex items-center gap-2">
                                {user.isEmailVerified ? (
                                  <><CheckCircle className="h-4 w-4 text-green-600" /> <span className="text-sm">Yes</span></>
                                ) : (
                                  <><XCircle className="h-4 w-4 text-destructive" /> <span className="text-sm">No</span></>
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold mb-1">Account Status</h4>
                              <Badge variant={user.flagged ? 'destructive' : 'default'}>
                                {user.flagged ? 'Flagged' : 'Active'}
                              </Badge>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold mb-1">User ID</h4>
                              <p className="text-xs text-muted-foreground font-mono">{user.id}</p>
                            </div>
                          </div>

                          {user.flagged && user.fraudAlertReason && (
                            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg" data-testid={`fraud-alert-reason-${user.id}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <Flag className="h-4 w-4 text-destructive" />
                                <h4 className="text-sm font-semibold text-destructive">Fraud Alert Details</h4>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-muted-foreground">Type:</span>
                                  <Badge variant="destructive" className="text-xs">{user.fraudAlertType}</Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-muted-foreground">AI Confidence:</span>
                                  <Badge variant="outline" className="text-xs">{user.fraudAlertConfidence}%</Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-muted-foreground">Status:</span>
                                  <Badge 
                                    variant={user.fraudAlertStatus === 'confirmed' ? 'destructive' : user.fraudAlertStatus === 'dismissed' ? 'secondary' : 'outline'} 
                                    className="text-xs capitalize"
                                  >
                                    {user.fraudAlertStatus}
                                  </Badge>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground block mb-1">Reason:</span>
                                  <p className="text-sm text-foreground">{user.fraudAlertReason}</p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {user.location && (
                            <div>
                              <h4 className="text-sm font-semibold mb-1">Location</h4>
                              <p className="text-sm text-muted-foreground">{user.location}</p>
                            </div>
                          )}

                          {user.bio && (
                            <div>
                              <h4 className="text-sm font-semibold mb-1">Bio</h4>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{user.bio}</p>
                            </div>
                          )}

                          {user.companyName && (
                            <div>
                              <h4 className="text-sm font-semibold mb-1">Company</h4>
                              <p className="text-sm text-muted-foreground">{user.companyName}</p>
                            </div>
                          )}

                          {user.phoneNumber && (
                            <div>
                              <h4 className="text-sm font-semibold mb-1">Phone Number</h4>
                              <p className="text-sm text-muted-foreground">{user.phoneNumber}</p>
                            </div>
                          )}

                          {user.skills && user.skills.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-1">Skills</h4>
                              <div className="flex flex-wrap gap-2">
                                {user.skills.map((skill: string, idx: number) => (
                                  <Badge key={idx} variant="secondary">{skill}</Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {user.resumeUrl && (
                            <div className="pt-4 border-t">
                              <h4 className="text-sm font-semibold mb-2">Resume</h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open('/objects' + user.resumeUrl, '_blank')}
                                data-testid={`button-view-resume-${user.id}`}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Resume
                              </Button>
                            </div>
                          )}

                          <div className="pt-4 border-t">
                            <h4 className="text-sm font-semibold mb-2">Activity</h4>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center justify-between p-2 bg-muted rounded">
                                <span className="text-sm">Applications</span>
                                <Badge variant="outline">{user.totalApplications || 0}</Badge>
                              </div>
                              {user.role === 'employer' && (
                                <div className="flex items-center justify-between p-2 bg-muted rounded">
                                  <span className="text-sm">Jobs Posted</span>
                                  <Badge variant="outline">{user.totalJobs || 0}</Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant={user.flagged ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => flagUserMutation.mutate({ id: user.id, isFlagged: !user.flagged })}
                      disabled={flagUserMutation.isPending}
                      data-testid={`button-flag-${user.id}`}
                    >
                      {user.flagged ? (
                        <>
                          <XCircle className="h-4 w-4 mr-1" />
                          Unflag
                        </>
                      ) : (
                        <>
                          <Flag className="h-4 w-4 mr-1" />
                          Flag
                        </>
                      )}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          data-testid={`button-delete-${user.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent data-testid={`dialog-delete-${user.id}`}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete User</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {user.firstName} {user.lastName} ({user.email})? 
                            This will permanently delete their account and all associated data including:
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>Profile information</li>
                              {user.role === 'job_seeker' && <li>Applications and work history</li>}
                              {user.role === 'employer' && <li>Job postings and applications</li>}
                              <li>All related records</li>
                            </ul>
                            <strong className="block mt-2">This action cannot be undone.</strong>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid={`button-cancel-delete-${user.id}`}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteUserMutation.mutate(user.id)}
                            disabled={deleteUserMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover-elevate active-elevate-2"
                            data-testid={`button-confirm-delete-${user.id}`}
                          >
                            {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
              {paginatedUsers.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">No users found</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
