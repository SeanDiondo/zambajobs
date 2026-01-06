import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Briefcase, Clock, Bookmark, Sparkles, Building2 } from "lucide-react";
import { formatPesoRange } from "@/lib/philippines";
import type { Job } from "@shared/schema";

export default function Jobs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");

  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs", { search: searchTerm, location, jobType, category }],
  });

  const filteredJobs = jobs?.filter(job => job.isActive && !job.isFlagged) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
          <Link href="/jobs">
            <div className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-3 py-2">
              <Briefcase className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">ZambaJobs</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" data-testid="button-dashboard">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <section className="border-b bg-muted/30 py-8">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <h1 className="mb-6 text-3xl font-bold">Find Your Next Opportunity</h1>
          
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Job title, keywords, or company"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10"
                data-testid="input-location"
              />
            </div>

            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger className="w-full md:w-[180px]" data-testid="select-job-type">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="full_time">Full Time</SelectItem>
                <SelectItem value="part_time">Part Time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full md:w-[180px]" data-testid="select-category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Design">Design</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Jobs List */}
      <section className="py-8">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} found
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader className="gap-4">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
              <Briefcase className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
              <p className="text-muted-foreground max-w-md">
                Try adjusting your search criteria or filters to find more opportunities
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="hover-elevate flex flex-col" data-testid={`card-job-${job.id}`}>
                  <CardHeader className="space-y-0 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <Button size="icon" variant="ghost" data-testid={`button-bookmark-${job.id}`}>
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="pt-4">
                      <CardTitle className="line-clamp-1">{job.title}</CardTitle>
                      <CardDescription className="mt-1">{job.location}</CardDescription>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {job.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="gap-1">
                        <Briefcase className="h-3 w-3" />
                        {job.jobType.replace('_', ' ')}
                      </Badge>
                      {job.category && (
                        <Badge variant="outline">{job.category}</Badge>
                      )}
                      {job.aiMatchScore && job.aiMatchScore > 70 && (
                        <Badge variant="default" className="gap-1">
                          <Sparkles className="h-3 w-3" />
                          {job.aiMatchScore}% Match
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {(job.salaryMin || job.salaryMax) && (
                        <div className="flex items-center gap-1">
                          <span>
                            {formatPesoRange(job.salaryMin, job.salaryMax)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Link href={`/jobs/${job.id}`} className="w-full">
                      <Button className="w-full" data-testid={`button-view-job-${job.id}`}>
                        View Details
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
