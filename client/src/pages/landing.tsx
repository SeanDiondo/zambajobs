import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Shield, Sparkles, Search, MapPin, Users, TrendingUp, CheckCircle } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-3 py-2">
              <Briefcase className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">ZambaJobs</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" data-testid="button-login">
                Log In
              </Button>
            </Link>
            <Link href="/register">
              <Button data-testid="button-signup">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 py-24 md:py-32">
        <div className="absolute inset-0 bg-grid-slate-200/20 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
        <div className="container relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4" variant="secondary" data-testid="badge-ai-powered">
              <Sparkles className="mr-2 h-3 w-3" />
              AI-Powered Fraud Detection
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Find Your Dream Job with{" "}
              <span className="text-primary">AI-Powered Matching</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              Secure, intelligent job portal connecting talented professionals with trusted employers. Protected by advanced fraud detection.
            </p>
            
            {/* Search Bar */}
            <div className="mx-auto mb-8 flex max-w-2xl flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Job title or keyword"
                  className="pl-10"
                  data-testid="input-job-search"
                />
              </div>
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Location"
                  className="pl-10"
                  data-testid="input-location-search"
                />
              </div>
              <Button size="lg" data-testid="button-search-jobs">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/jobs">
                <Button size="lg" data-testid="button-find-jobs">
                  Find Jobs
                </Button>
              </Link>
              <Link href="/employer/post-job">
                <Button size="lg" variant="outline" data-testid="button-post-jobs">
                  Post a Job
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Why Choose ZambaJobs?</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Advanced technology meets professional recruitment for a safer, smarter hiring experience
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover-elevate" data-testid="card-feature-ai">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI Job Matching</CardTitle>
                <CardDescription>
                  Our intelligent algorithm analyzes your skills and experience to recommend the perfect job opportunities
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-security">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-md bg-destructive/10">
                  <Shield className="h-6 w-6 text-destructive" />
                </div>
                <CardTitle>Fraud Detection</CardTitle>
                <CardDescription>
                  Advanced AI monitors all profiles and job postings to protect you from scams and fraudulent activity
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-verified">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-md bg-chart-1/10">
                  <CheckCircle className="h-6 w-6 text-chart-1" />
                </div>
                <CardTitle>Verified Employers</CardTitle>
                <CardDescription>
                  All employers are verified to ensure you're applying to legitimate companies with real opportunities
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-smart">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-md bg-chart-2/10">
                  <TrendingUp className="h-6 w-6 text-chart-2" />
                </div>
                <CardTitle>Smart Recommendations</CardTitle>
                <CardDescription>
                  Employers receive AI-powered candidate suggestions matching their job requirements perfectly
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-professional">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-md bg-accent/50">
                  <Briefcase className="h-6 w-6 text-accent-foreground" />
                </div>
                <CardTitle>Professional Profiles</CardTitle>
                <CardDescription>
                  Build comprehensive profiles with work experience, education, certifications, and portfolio links
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-community">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-md bg-chart-4/10">
                  <Users className="h-6 w-6 text-chart-4" />
                </div>
                <CardTitle>Growing Community</CardTitle>
                <CardDescription>
                  Join thousands of professionals and companies building meaningful careers and teams
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Join ZambaJobs today and experience the future of secure recruitment
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/jobs">
              <Button size="lg" data-testid="button-cta-seeker">
                I'm Looking for Jobs
              </Button>
            </Link>
            <Link href="/employer/post-job">
              <Button size="lg" variant="outline" data-testid="button-cta-employer">
                I'm Hiring Talent
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <span className="font-semibold">ZambaJobs</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Secure & Private</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 ZambaJobs. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
