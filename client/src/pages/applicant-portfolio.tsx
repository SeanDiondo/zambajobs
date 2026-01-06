import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Linkedin, 
  Briefcase, 
  GraduationCap, 
  Award,
  Download,
  User,
  FileText
} from "lucide-react";

export default function ApplicantPortfolio() {
  const [, params] = useRoute("/employer/applicant/:userId");
  const userId = params?.userId;

  const { data: applicant, isLoading, isError } = useQuery<any>({
    queryKey: ["/api/employer/applicant", userId],
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !applicant) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Applicant not found</p>
        <Link href="/employer/dashboard">
          <Button className="mt-4" data-testid="button-back-error">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const fullName = `${applicant.firstName} ${applicant.lastName}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()} data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24">
              {applicant.profileImage && (
                <AvatarImage 
                  src={`/objects${applicant.profileImage}`}
                  alt={fullName}
                />
              )}
              <AvatarFallback>
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2" data-testid="text-applicant-name">{fullName}</h1>
              {applicant.headline && (
                <p className="text-lg text-muted-foreground mb-4">{applicant.headline}</p>
              )}
              
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {applicant.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{applicant.location}</span>
                  </div>
                )}
                {applicant.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${applicant.email}`} className="text-primary hover:underline">
                      {applicant.email}
                    </a>
                  </div>
                )}
                {applicant.phoneNumber && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{applicant.phoneNumber}</span>
                  </div>
                )}
                {applicant.linkedinUrl && (
                  <div className="flex items-center gap-2 text-sm">
                    <Linkedin className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={applicant.linkedinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      LinkedIn Profile
                    </a>
                  </div>
                )}
                {applicant.portfolioUrl && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={applicant.portfolioUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Portfolio Website
                    </a>
                  </div>
                )}
                {applicant.resumeUrl && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={`/objects${applicant.resumeUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                      data-testid="link-resume"
                    >
                      <Download className="h-3 w-3 inline mr-1" />
                      View Resume
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      {applicant.bio && (
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{applicant.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {applicant.skills && applicant.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>Professional expertise and capabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {applicant.skills.map((skill: string, idx: number) => (
                <Badge key={idx} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Work Experience */}
      {applicant.workExperience && applicant.workExperience.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Work Experience
            </CardTitle>
            <CardDescription>Professional work history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {applicant.workExperience.map((exp: any, idx: number) => (
                <div key={exp.id || idx} data-testid={`work-experience-${idx}`}>
                  {idx > 0 && <Separator className="my-6" />}
                  <div>
                    <h3 className="font-semibold text-lg">{exp.jobTitle}</h3>
                    <p className="text-muted-foreground">{exp.companyName}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(exp.startDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                      })} - {exp.endDate 
                        ? new Date(exp.endDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            year: 'numeric' 
                          })
                        : 'Present'}
                    </p>
                    {exp.description && (
                      <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">
                        {exp.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Education */}
      {applicant.education && applicant.education.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Education
            </CardTitle>
            <CardDescription>Academic background</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {applicant.education.map((edu: any, idx: number) => (
                <div key={edu.id || idx} data-testid={`education-${idx}`}>
                  {idx > 0 && <Separator className="my-6" />}
                  <div>
                    <h3 className="font-semibold text-lg">{edu.degree}</h3>
                    <p className="text-muted-foreground">{edu.institution}</p>
                    {edu.fieldOfStudy && (
                      <p className="text-sm text-muted-foreground">Field of Study: {edu.fieldOfStudy}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(edu.startDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                      })} - {edu.endDate 
                        ? new Date(edu.endDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            year: 'numeric' 
                          })
                        : 'Present'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certifications */}
      {applicant.certifications && applicant.certifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Certifications
            </CardTitle>
            <CardDescription>Professional certifications and licenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {applicant.certifications.map((cert: any, idx: number) => (
                <div 
                  key={cert.id || idx} 
                  className="flex items-start justify-between p-4 rounded-md border"
                  data-testid={`certification-${idx}`}
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{cert.name}</h3>
                    <p className="text-sm text-muted-foreground">{cert.issuingOrganization}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Issued: {new Date(cert.issueDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                      {cert.expiryDate && (
                        <> • Expires: {new Date(cert.expiryDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          year: 'numeric' 
                        })}</>
                      )}
                    </p>
                    {cert.credentialUrl && (
                      <a 
                        href={cert.credentialUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline mt-2 inline-block"
                      >
                        View Credential
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
