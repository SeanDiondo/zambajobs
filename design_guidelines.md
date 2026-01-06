# ZambaJobs Design Guidelines

## Design Approach
**Reference-Based**: Inspired by LinkedIn's professional aesthetic with OnlineJobs.ph's clarity. Focus on trust, credibility, and efficient information presentation while maintaining modern visual appeal.

## Core Design Principles
1. **Professional Trust**: Clean, corporate design establishing credibility
2. **Role Clarity**: Distinct visual treatments for Job Seeker, Employer, and Admin views
3. **Information Hierarchy**: Clear content prioritization for job listings and profiles
4. **Icon-Driven Navigation**: Strategic iconography enhancing usability

## Typography
- **Primary Font**: Inter or Open Sans via Google Fonts CDN
- **Display Font**: Same as primary for consistency
- **Hierarchy**:
  - H1: 2.5rem (40px), font-bold - Page titles
  - H2: 2rem (32px), font-semibold - Section headers
  - H3: 1.5rem (24px), font-semibold - Card titles, job titles
  - Body: 1rem (16px), font-normal - General content
  - Small: 0.875rem (14px), font-normal - Metadata, timestamps

## Layout System
**Spacing Units**: Tailwind units of 4, 6, 8, 12, 16, 24
- Component padding: p-6, p-8
- Section spacing: py-12, py-16, py-24
- Card gaps: gap-6, gap-8
- Container: max-w-7xl with px-4 md:px-6 lg:px-8

## Component Library

### Navigation
- **Header**: Sticky top navigation with logo left, main nav center, auth/profile right
- Include icons: Home, Jobs, Companies, Messages, Notifications (bell icon)
- Profile dropdown with role badge (Seeker/Employer/Admin)
- Mobile: Hamburger menu with slide-out drawer

### Hero Section
- **Landing Page**: Full-width hero (h-96 to h-screen) with professional imagery
- Image: Modern office environment or diverse professionals collaborating
- Overlay: Gradient overlay for text readability
- Content: Bold headline, subheading, dual CTA buttons (Sign Up, Browse Jobs)
- Search bar prominently featured in hero for job search

### Job Listings
- **Card Layout**: Grid system (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Each card includes:
  - Company logo (top-left, rounded)
  - Job title (H3)
  - Company name with verification badge icon
  - Location icon + location
  - Clock icon + posted time
  - Salary range with dollar icon
  - Tag pills for job type (Remote, Full-time, etc.)
  - Bookmark icon (top-right)
- Hover state: Subtle elevation increase

### Profile Components
- **Professional Background Section**:
  - Work Experience: Briefcase icon, company logo, role, duration, description
  - Education: Graduation cap icon, institution, degree, years
  - Certifications: Award/certificate icon, certification name, issuer
  - Skills: Tag pills with checkmark icons
  - Portfolio Links: LinkedIn icon, GitHub icon, personal website icon
- Timeline layout for experience/education (vertical line connecting entries)

### Forms & Inputs
- **Registration/Login**: Clean centered card (max-w-md)
- Google Sign-In: Large button with Google logo, "Continue with Google"
- Divider: "OR" with horizontal lines
- Input fields: Icon prefix (email icon, lock icon, user icon)
- Resume upload: Drag-drop zone with upload icon and file preview
- Form validation: Inline error messages with warning icon

### Dashboard Layouts
- **Job Seeker**: 
  - Sidebar: Profile completion meter, quick stats (applications, views)
  - Main: Recommended jobs feed, recent applications table
  
- **Employer**:
  - Sidebar: Active job postings count, candidate pipeline
  - Main: Job management table, candidate recommendations
  
- **Super Admin**:
  - Alert panel: Flagged content with warning icons, AI confidence scores
  - Moderation queue: Review cards with approve/reject actions
  - System stats: Dashboard widgets with trend charts

### Application Flow
- Apply button: Prominent primary CTA
- Application modal: Cover letter textarea, resume selection, submit
- Status badges: Applied (blue), Reviewing (yellow), Rejected (red), Accepted (green)
- Timeline view: Progress tracker with icons for each stage

### AI Features UI
- **Fraud Detection Alerts**: Yellow/red warning cards with shield icon
- **Job Match Score**: Percentage badge with AI sparkle icon
- **Smart Suggestions**: Recommendation cards with "AI Matched" label

## Icons
**Library**: Heroicons via CDN
- Professional background: briefcase, academic-cap, certificate, code, link
- Navigation: home, briefcase, building, chat, bell, user
- Actions: bookmark, heart, share, filter, search, upload, trash, check, x
- Status: shield-check, shield-exclamation, clock, map-pin

## Animations
**Minimal & Purposeful**:
- Card hover: Subtle translate-y and shadow increase (transition-transform duration-200)
- Button states: Scale on click (active:scale-95)
- Page transitions: Fade-in for content load
- NO scroll-based animations, parallax, or decorative motion

## Images
- **Hero**: High-quality professional workspace or team collaboration (1920x800px minimum)
- **Company Logos**: Displayed in job cards and employer profiles (100x100px, rounded)
- **Profile Photos**: User avatars (circular, 40px, 80px, 160px sizes)
- **Placeholder**: Use gradient backgrounds with initials for missing avatars

## Responsive Behavior
- Desktop (lg:): Multi-column layouts, expanded sidebar
- Tablet (md:): 2-column grids, collapsible sidebar
- Mobile: Single column, bottom navigation for key actions, hamburger menu

## Trust & Security Elements
- Verification badges: Blue checkmark icon for verified employers
- Security indicators: Lock icon for secure pages, shield for fraud protection
- Data privacy: Badge/seal in footer ("Secure & Private")
- Email verification: Envelope icon with status indicator