import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle, XCircle, User, Briefcase, Eye, MapPin, Banknote, Calendar, Mail, Shield } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

export default function AdminFraud() {
  const { toast } = useToast();
  const [reviewingAlert, setReviewingAlert] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [viewingDetails, setViewingDetails] = useState<any>(null);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const { data: alerts, isLoading, isError } = useQuery<any[]>({
    queryKey: ["/api/admin/fraud-alerts"],
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

  const reviewAlertMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      return await apiRequest("PUT", `/api/admin/fraud-alerts/${id}`, { status, reviewNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fraud-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setReviewingAlert(null);
      setReviewNotes("");
      toast({ title: "Success", description: "Alert reviewed successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to review alert", variant: "destructive" });
    },
  });

  const pendingAlerts = alerts?.filter(a => a.status === 'pending') || [];
  const confirmedAlerts = alerts?.filter(a => a.status === 'confirmed') || [];
  const dismissedAlerts = alerts?.filter(a => a.status === 'dismissed') || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Fraud Detection</h1>
        <p className="text-muted-foreground">Monitor and review suspicious activity</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{pendingAlerts.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="h-3 w-3" />
              <span>Awaiting action</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Confirmed Fraud</CardDescription>
            <CardTitle className="text-3xl text-destructive">{confirmedAlerts.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <XCircle className="h-3 w-3" />
              <span>Verified threats</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Dismissed</CardDescription>
            <CardTitle className="text-3xl text-green-600">{dismissedAlerts.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3" />
              <span>False positives</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading fraud alerts...
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="py-8 text-center text-destructive">
            Failed to load fraud alerts
          </CardContent>
        </Card>
      ) : (
        <>
          {pendingAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Review</CardTitle>
                <CardDescription>Alerts requiring your attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-4 rounded-md border space-y-3"
                      data-testid={`alert-${alert.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {alert.alertType === 'Suspicious Profile' ? (
                              <User className="h-4 w-4 text-destructive" />
                            ) : (
                              <Briefcase className="h-4 w-4 text-destructive" />
                            )}
                            <h3 className="font-medium">{alert.alertType}</h3>
                            <Badge variant="outline" className="text-xs">
                              Confidence: {alert.aiConfidence}%
                            </Badge>
                          </div>
                          
                          {/* Show what was flagged */}
                          {alert.entityInfo && (
                            <div className="mb-2 p-2 rounded bg-muted/50">
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Flagged {alert.entityType}:</p>
                              {alert.entityType === 'user' ? (
                                <div className="text-sm">
                                  <p className="font-medium">{alert.entityInfo.name}</p>
                                  <p className="text-xs text-muted-foreground">{alert.entityInfo.email}</p>
                                  <Badge variant="secondary" className="text-xs mt-1">{alert.entityInfo.role}</Badge>
                                </div>
                              ) : (
                                <div className="text-sm">
                                  <p className="font-medium">{alert.entityInfo.title}</p>
                                  <p className="text-xs text-muted-foreground">{alert.entityInfo.company}</p>
                                  <p className="text-xs text-muted-foreground">Posted by: {alert.entityInfo.employerName}</p>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Detected {format(new Date(alert.createdAt), 'PPp')}
                          </p>
                        </div>
                      </div>
                      
                      {reviewingAlert === alert.id ? (
                        <div className="space-y-3 pt-3 border-t">
                          <Textarea
                            placeholder="Add review notes..."
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            data-testid={`textarea-notes-${alert.id}`}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => reviewAlertMutation.mutate({ id: alert.id, status: 'confirmed', notes: reviewNotes })}
                              disabled={reviewAlertMutation.isPending}
                              data-testid={`button-confirm-${alert.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Confirm Fraud
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => reviewAlertMutation.mutate({ id: alert.id, status: 'dismissed', notes: reviewNotes })}
                              disabled={reviewAlertMutation.isPending}
                              data-testid={`button-dismiss-${alert.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Dismiss
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setReviewingAlert(null);
                                setReviewNotes("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(alert)}
                            data-testid={`button-view-details-${alert.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setReviewingAlert(alert.id)}
                            data-testid={`button-review-${alert.id}`}
                          >
                            Review Alert
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {confirmedAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Confirmed Fraud</CardTitle>
                <CardDescription>Verified fraudulent activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {confirmedAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-4 rounded-md border bg-destructive/5"
                      data-testid={`confirmed-${alert.id}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="h-4 w-4 text-destructive" />
                        <h3 className="font-medium text-destructive">{alert.alertType}</h3>
                      </div>
                      
                      {/* Show what was flagged */}
                      {alert.entityInfo && (
                        <div className="mb-2 p-2 rounded bg-muted/50">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Flagged {alert.entityType}:</p>
                          {alert.entityType === 'user' ? (
                            <div className="text-sm">
                              <p className="font-medium">{alert.entityInfo.name}</p>
                              <p className="text-xs text-muted-foreground">{alert.entityInfo.email}</p>
                            </div>
                          ) : (
                            <div className="text-sm">
                              <p className="font-medium">{alert.entityInfo.title}</p>
                              <p className="text-xs text-muted-foreground">{alert.entityInfo.company}</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <p className="text-sm text-muted-foreground mb-1">{alert.description}</p>
                      
                      {/* Show who reviewed it */}
                      {alert.reviewerInfo && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Reviewed by: {alert.reviewerInfo.name}
                        </p>
                      )}
                      
                      {alert.reviewNotes && (
                        <p className="text-sm italic mt-2">Notes: {alert.reviewNotes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {dismissedAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Dismissed Alerts</CardTitle>
                <CardDescription>False positives and cleared alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dismissedAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-4 rounded-md border bg-green-50 dark:bg-green-950/20"
                      data-testid={`dismissed-${alert.id}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <h3 className="font-medium text-green-700 dark:text-green-400">{alert.alertType}</h3>
                      </div>
                      
                      {/* Show what was flagged */}
                      {alert.entityInfo && (
                        <div className="mb-2 p-2 rounded bg-muted/50">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Flagged {alert.entityType}:</p>
                          {alert.entityType === 'user' ? (
                            <div className="text-sm">
                              <p className="font-medium">{alert.entityInfo.name}</p>
                              <p className="text-xs text-muted-foreground">{alert.entityInfo.email}</p>
                            </div>
                          ) : (
                            <div className="text-sm">
                              <p className="font-medium">{alert.entityInfo.title}</p>
                              <p className="text-xs text-muted-foreground">{alert.entityInfo.company}</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <p className="text-sm text-muted-foreground mb-1">{alert.description}</p>
                      
                      {/* Show who reviewed it */}
                      {alert.reviewerInfo && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Dismissed by: {alert.reviewerInfo.name}
                        </p>
                      )}
                      
                      {alert.reviewNotes && (
                        <p className="text-sm italic mt-2">Notes: {alert.reviewNotes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={!!viewingDetails} onOpenChange={() => {
        setViewingDetails(null);
        setDetailsData(null);
      }}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {viewingDetails?.entityType === 'user' ? 'User Profile Details' : 'Job Post Details'}
            </DialogTitle>
            <DialogDescription>
              Detailed information for fraud alert investigation
            </DialogDescription>
          </DialogHeader>
          
          {viewingDetails && (
            <div className="mb-4 p-4 rounded-md bg-destructive/10 border border-destructive/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive mb-1">Fraud Alert Reason</p>
                  <p className="text-sm">{viewingDetails.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      Confidence: {viewingDetails.aiConfidence}%
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {viewingDetails.alertType}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <ScrollArea className="max-h-[60vh] pr-4">
            {loadingDetails ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading details...
              </div>
            ) : !detailsData ? (
              <div className="py-8 text-center text-destructive">
                No data found for this {viewingDetails?.entityType}
              </div>
            ) : viewingDetails?.entityType === 'user' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="text-base">{detailsData.firstName} {detailsData.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <p className="text-base">{detailsData.email}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Role</p>
                    <Badge variant="outline">{detailsData.role || 'Not set'}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <div className="flex items-center gap-2">
                      <Shield className={detailsData.isFlagged ? "h-4 w-4 text-destructive" : "h-4 w-4 text-green-600"} />
                      <Badge variant={detailsData.isFlagged ? "destructive" : "default"}>
                        {detailsData.isFlagged ? 'Flagged' : 'Active'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Additional Information</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p>Joined: {detailsData.createdAt ? format(new Date(detailsData.createdAt), 'PPP') : 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={detailsData.isEmailVerified ? "h-4 w-4 text-green-600" : "h-4 w-4 text-muted-foreground"} />
                      <p>Email {detailsData.isEmailVerified ? 'Verified' : 'Not Verified'}</p>
                    </div>
                  </div>
                </div>

                {detailsData.role === 'job_seeker' && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Profile Stats</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Applications</p>
                          <p className="text-lg font-semibold">{detailsData.applicationCount || 0}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {detailsData.role === 'employer' && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Employer Stats</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Jobs Posted</p>
                          <p className="text-lg font-semibold">{detailsData.jobCount || 0}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Job Title</p>
                  <p className="text-lg font-semibold">{detailsData.title}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-muted-foreground">Location</p>
                    </div>
                    <p className="text-base">{detailsData.location}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Job Type</p>
                    <Badge>{detailsData.jobType?.replace('_', ' ')}</Badge>
                  </div>
                </div>

                <Separator />

                {(detailsData.salaryMin || detailsData.salaryMax) && (
                  <>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">Salary Range</p>
                      </div>
                      <p className="text-base">
                        {detailsData.salaryMin ? `${detailsData.salaryCurrency || 'USD'} ${detailsData.salaryMin.toLocaleString()}` : 'N/A'}
                        {' - '}
                        {detailsData.salaryMax ? `${detailsData.salaryCurrency || 'USD'} ${detailsData.salaryMax.toLocaleString()}` : 'N/A'}
                      </p>
                    </div>
                    <Separator />
                  </>
                )}

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                  <p className="text-sm whitespace-pre-wrap">{detailsData.description}</p>
                </div>

                {detailsData.skills && detailsData.skills.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Required Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {detailsData.skills.map((skill: string, index: number) => (
                          <Badge key={index} variant="outline">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p>Posted: {detailsData.createdAt ? format(new Date(detailsData.createdAt), 'PPP') : 'N/A'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className={detailsData.isFlagged ? "h-4 w-4 text-destructive" : "h-4 w-4 text-green-600"} />
                    <Badge variant={detailsData.isFlagged ? "destructive" : "default"}>
                      {detailsData.isFlagged ? 'Flagged' : detailsData.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
