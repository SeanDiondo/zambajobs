import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Shield, Mail, CheckCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AdminManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users, isLoading, isError } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  const adminUsers = users?.filter(u => u.role === 'admin') || [];
  
  const filteredAdmins = adminUsers.filter(u =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Management</h1>
        <p className="text-muted-foreground">Manage platform administrators</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Admins</CardTitle>
          <CardDescription>Find administrators by name or email</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search admins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-admins"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading administrators...
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="py-8 text-center text-destructive">
            Failed to load administrators
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Platform Administrators ({filteredAdmins.length})</CardTitle>
            <CardDescription>Users with admin privileges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredAdmins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-4 rounded-md border hover-elevate"
                  data-testid={`admin-row-${admin.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-destructive" />
                      <p className="font-medium">{admin.firstName} {admin.lastName}</p>
                      <Badge variant="destructive" className="text-xs">
                        Admin
                      </Badge>
                      {admin.isEmailVerified && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{admin.email}</p>
                    </div>
                  </div>
                </div>
              ))}
              {filteredAdmins.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">No administrators found</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Admin Privileges</CardTitle>
          <CardDescription>Capabilities of admin users</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>View and manage all users</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Monitor and flag job postings</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Review fraud alerts</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Access platform analytics</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Manage contact messages</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
