import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Flag, XCircle, MapPin, Building2, Eye, Trash2, FileText, ExternalLink } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { formatPesoRange } from "@/lib/philippines";

export default function AdminJobs() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: jobs, isLoading, isError } = useQuery<any[]>({
    queryKey: ["/api/admin/jobs"],
  });

  const flagJobMutation = useMutation({
    mutationFn: async ({ id, isFlagged }: { id: string; isFlagged: boolean }) => {
      return await apiRequest("PUT", `/api/admin/jobs/${id}/flag`, { isFlagged });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Success", description: "Job status updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update job", variant: "destructive" });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/jobs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Success", description: "Job deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete job", variant: "destructive" });
    },
  });

  const filteredJobs = jobs?.filter(j =>
    !searchQuery ||
    j.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.jobType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Job Management</h1>
        <p className="text-muted-foreground">Monitor and manage all job postings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Jobs</CardTitle>
          <CardDescription>Find jobs by title, location, or type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-jobs"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading jobs...
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="py-8 text-center text-destructive">
            Failed to load jobs
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Jobs ({filteredJobs.length})</CardTitle>
            <CardDescription>Platform job postings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-start justify-between p-4 rounded-md border hover-elevate"
                  data-testid={`job-row-${job.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-lg">{job.title}</h3>
                      <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                      {job.isFlagged && (
                        <Flag className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span>{job.companyName || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{job.location}</span>
                      </div>
                      {(job.salaryMin || job.salaryMax) && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <span>{formatPesoRange(job.salaryMin, job.salaryMax)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {job.jobType?.replace('_', ' ') || 'Not specified'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Posted {format(new Date(job.createdAt), 'MMM d, yyyy')}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" data-testid={`button-view-job-${job.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{job.title}</DialogTitle>
                          <DialogDescription>
                            {job.companyName} • {job.location}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Description</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                          </div>
                          {job.requirements && job.requirements.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">Requirements</h4>
                              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                {job.requirements.map((req: string, idx: number) => (
                                  <li key={idx}>{req}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {job.responsibilities && job.responsibilities.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">Responsibilities</h4>
                              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                {job.responsibilities.map((resp: string, idx: number) => (
                                  <li key={idx}>{resp}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {job.skills && job.skills.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">Required Skills</h4>
                              <div className="flex flex-wrap gap-2">
                                {job.skills.map((skill: string, idx: number) => (
                                  <Badge key={idx} variant="secondary">{skill}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {job.requirementDocumentUrl && (
                            <div>
                              <h4 className="font-semibold mb-2">Requirement Document</h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open('/objects' + job.requirementDocumentUrl, '_blank')}
                                data-testid={`button-preview-document-${job.id}`}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                View Document
                                <ExternalLink className="h-3 w-3 ml-2" />
                              </Button>
                            </div>
                          )}
                          {job.isFlagged && job.fraudAlertReason && (
                            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg" data-testid={`fraud-alert-reason-${job.id}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <Flag className="h-4 w-4 text-destructive" />
                                <h4 className="text-sm font-semibold text-destructive">Fraud Alert Details</h4>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-muted-foreground">Type:</span>
                                  <Badge variant="destructive" className="text-xs">{job.fraudAlertType}</Badge>
                                </div>
                                {job.fraudAlertConfidence !== null && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground">AI Confidence:</span>
                                    <Badge variant="outline" className="text-xs">{job.fraudAlertConfidence}%</Badge>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-muted-foreground">Status:</span>
                                  <Badge 
                                    variant={job.fraudAlertStatus === 'confirmed' ? 'destructive' : job.fraudAlertStatus === 'dismissed' ? 'secondary' : 'outline'} 
                                    className="text-xs capitalize"
                                  >
                                    {job.fraudAlertStatus}
                                  </Badge>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground block mb-1">Reason:</span>
                                  <p className="text-sm text-foreground">{job.fraudAlertReason}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 pt-4 border-t">
                            <Badge>{job.jobType?.replace('_', ' ')}</Badge>
                            {(job.salaryMin || job.salaryMax) && (
                              <Badge variant="outline">{formatPesoRange(job.salaryMin, job.salaryMax)}</Badge>
                            )}
                            <Badge variant={job.isActive ? 'default' : 'secondary'}>
                              {job.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            {job.isFlagged && <Badge variant="destructive">Flagged</Badge>}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {job.requirementDocumentUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open('/objects' + job.requirementDocumentUrl, '_blank')}
                        data-testid={`button-quick-preview-${job.id}`}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Document
                      </Button>
                    )}

                    <Button
                      variant={job.isFlagged ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => flagJobMutation.mutate({ id: job.id, isFlagged: !job.isFlagged })}
                      disabled={flagJobMutation.isPending}
                      data-testid={`button-flag-job-${job.id}`}
                    >
                      {job.isFlagged ? (
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
                        <Button variant="destructive" size="sm" data-testid={`button-delete-job-${job.id}`}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Job Posting</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{job.title}"? This action cannot be undone.
                            All applications for this job will also be affected.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteJobMutation.mutate(job.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
              {filteredJobs.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">No jobs found</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
