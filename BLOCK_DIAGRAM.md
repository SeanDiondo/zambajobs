# ZambaJobs System Architecture - Block Diagram

![ZambaJobs Architecture Diagram](attached_assets/generated_images/ZambaJobs_system_architecture_diagram_4aa08144.png)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   User Interface (Browser)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   👤 Job     │  │   🏢 Employer │  │   🛡️ Admin   │          │
│  │    Seeker    │  │    Portal     │  │    Panel     │          │
│  │   Dashboard  │  │               │  │              │          │
│  │              │  │               │  │              │          │
│  │ • Profile    │  │ • Post Jobs   │  │ • User Mgmt  │          │
│  │ • Job Search │  │ • Applicants  │  │ • Job Mgmt   │          │
│  │ • Apply      │  │ • Analytics   │  │ • Fraud Det  │          │
│  │ • Analytics  │  │               │  │ • Analytics  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express.js Web Server                         │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Routes/Controllers                       │  │
│  │  /api/auth  /api/jobs  /api/profile  /api/employer       │  │
│  │  /api/applications  /api/admin  /api/recommendations     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Authentication (Passport.js)                      │  │
│  │  • Email/Password (Bcrypt + JWT)                          │  │
│  │  • Google OAuth 2.0                                       │  │
│  │  • OTP Verification (10-min expiry)                       │  │
│  │  • Session Management (PostgreSQL)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  AI Services │  │ File Storage │  │ Forms/Valid. │         │
│  │  • Fraud Det │  │ • Profiles   │  │ • Zod Schema │         │
│  │  • Matching  │  │ • Resumes    │  │ • Validation │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     Core Tables                           │  │
│  │                                                            │  │
│  │  • Users                    • Sessions                    │  │
│  │    - id, email, password    - sid, sess, expire           │  │
│  │    - role, verified         - user_id                     │  │
│  │                                                            │  │
│  │  • JobSeekerProfiles        • EmployerProfiles            │  │
│  │    - userId, headline       - userId, companyName         │  │
│  │    - bio, skills, location  - description, industry       │  │
│  │                                                            │  │
│  │  • Jobs                     • Applications                │  │
│  │    - employerId, title      - jobId, jobSeekerId          │  │
│  │    - description, salary    - status, coverLetter         │  │
│  │                                                            │  │
│  │  • WorkExperience           • Education                   │  │
│  │  • Certifications           • FraudAlerts                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                           │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🌐 OpenAI GPT-5 API                                      │  │
│  │     • Fraud Detection Analysis                            │  │
│  │     • Smart Job Matching (0-100 score)                    │  │
│  │     • Candidate Recommendations                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ☁️ Google Cloud Storage (GCS)                            │  │
│  │     • Profile Pictures (Public)                           │  │
│  │     • Resume/CV Files (Private)                           │  │
│  │     • ACL-based Access Control                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  📧 Resend Email API                                      │  │
│  │     • OTP Verification Codes                              │  │
│  │     • Password Reset Links                                │  │
│  │     • Application Notifications                           │  │
│  │     • Fraud Alert Emails                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🔐 Google OAuth 2.0                                      │  │
│  │     • Account Selection                                   │  │
│  │     • Profile Information                                 │  │
│  │     • Secure Authentication                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### User Interface Layer
**Technology**: React 18 + TypeScript, Vite, TanStack Query, Shadcn UI

1. **Job Seeker Dashboard**
   - Profile management (work experience, education, certifications)
   - Job search and filtering
   - AI-powered job recommendations
   - Application tracking
   - Personal analytics

2. **Employer Portal**
   - Job posting creation and management
   - Applicant portfolio viewer
   - Application filtering and sorting
   - Job performance analytics
   - CSV export

3. **Admin Panel**
   - User management (view, delete, create admins)
   - Job management (view, flag, delete)
   - Fraud alert monitoring
   - Platform-wide analytics
   - System oversight

### Backend Layer
**Technology**: Express.js, TypeScript, Passport.js, Drizzle ORM

**Routes/Controllers**
- `/api/auth/*` - Authentication and authorization
- `/api/jobs` - Job listings and search
- `/api/profile` - Profile management
- `/api/employer/*` - Employer operations
- `/api/applications` - Job applications
- `/api/admin/*` - Administrative functions
- `/api/recommendations` - AI job matching

**Authentication (Passport.js)**
- Email/Password with Bcrypt hashing
- JWT token generation
- Google OAuth 2.0 integration
- OTP verification (10-minute expiry, 5-attempt lockout)
- Session management with PostgreSQL store

**Additional Services**
- AI fraud detection and job matching
- File upload and storage management
- Form validation with Zod schemas

### Database Layer
**Technology**: PostgreSQL (Neon Serverless), Drizzle ORM

**Core Tables**
- `users` - User accounts with role-based access
- `job_seeker_profiles` - Job seeker information
- `employer_profiles` - Employer company details
- `jobs` - Job postings
- `applications` - Job applications
- `work_experience` - Employment history
- `education` - Educational background
- `certifications` - Professional certifications
- `fraud_alerts` - AI-detected suspicious activity
- `sessions` - User session management

### External Services

**OpenAI GPT-5 API**
- Analyzes user profiles for fraudulent patterns
- Validates job postings for scams
- Provides intelligent job-to-candidate matching
- Generates match scores (0-100) with reasoning

**Google Cloud Storage**
- Stores profile pictures (public access)
- Stores resume/CV files (private, owner-only access)
- Implements ACL-based permissions
- Integrated with Replit sidecar

**Resend Email API**
- Sends OTP verification codes
- Delivers password reset links
- Notifies employers of new applications
- Alerts admins of fraud detection

**Google OAuth 2.0**
- Enables "Continue with Google" login
- Provides secure authentication
- Auto-fills registration forms for new users
- Seamless account linking

## Data Flow

1. **User Request** → Browser sends request to Express.js server
2. **Authentication** → Passport.js validates session/token
3. **Authorization** → Route middleware checks user role and permissions
4. **Business Logic** → Controllers process request
5. **Database Operations** → Drizzle ORM queries PostgreSQL
6. **External Services** → AI analysis, file storage, email sending
7. **Response** → JSON data returned to browser
8. **UI Update** → React components re-render with new data

## Security Layers

- **Input Validation**: Zod schemas on all forms
- **SQL Injection Protection**: Parameterized queries via Drizzle ORM
- **Authentication**: Multi-factor with OTP + session management
- **Authorization**: Role-based access control (RBAC)
- **File Security**: Type validation, size limits, private access
- **AI Monitoring**: Automated fraud detection on profiles and jobs
- **Rate Limiting**: Protection against brute force attacks

---

**Domain**: zambajobs.digital  
**Hosting**: Replit  
**Last Updated**: November 19, 2025
