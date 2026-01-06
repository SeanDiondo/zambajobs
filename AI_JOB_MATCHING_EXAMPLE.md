# AI Job Matching Example

This document demonstrates how ZambaJobs' AI-powered job matching system works with real examples.

## Overview

The AI matching system uses **OpenAI's GPT-5 model** to intelligently analyze job seeker profiles against job postings. The AI considers multiple factors and provides a holistic match score from 0-100.

### How It Works

1. **AI-Driven Analysis**: GPT-5 evaluates the entire candidate profile (skills, experience, education, certifications, portfolio) against the job requirements
2. **Intelligent Scoring**: The AI provides context-aware reasoning for each match, considering both explicit requirements and implicit fit
3. **Philippine Market Context**: The AI is specifically trained to understand the Philippine job market, including local salary ranges, educational institutions, and career progression patterns
4. **Automatic Filtering**: Only jobs with match scores above 50 are shown to job seekers
5. **Limited Evaluation**: The system evaluates up to 10 active, unflagged jobs to balance quality and API costs

### Match Score Ranges

- **90-100**: Excellent match - Strong alignment across all factors
- **70-89**: Good match - Solid fit with minor gaps
- **51-69**: Moderate match - Some alignment but notable differences
- **50 and below**: Poor fit - Automatically filtered out and not shown

### Factors the AI Considers

While GPT-5 makes the final determination, it typically evaluates:
- Skills alignment with job requirements
- Relevant work experience in similar roles/industries  
- Educational background matching job needs
- Professional certifications
- Portfolio/resume presence (shows professionalism)
- Location compatibility
- Career progression and growth potential

**Note:** These factors don't have fixed weights. The AI dynamically weighs them based on the specific job and candidate context.

---

## Example 1: High Match Score (85-95)

### Job Seeker Profile

**Basic Information:**
- Name: Maria Santos
- Location: Manila, Philippines
- Headline: "Full Stack Developer with 5 years experience in React and Node.js"
- Bio: "Experienced full stack developer specializing in React, Node.js, and PostgreSQL. Strong background in building scalable web applications for fintech and e-commerce."

**Skills:**
- React
- Node.js
- TypeScript
- PostgreSQL
- Express.js
- REST APIs
- Git
- AWS

**Work Experience:**
1. **Senior Full Stack Developer** at Tech Solutions Inc. (2020-Present)
   - Led development of enterprise web applications using React and Node.js
   - Implemented microservices architecture with Express.js and PostgreSQL
   - Mentored junior developers on TypeScript best practices

2. **Full Stack Developer** at Digital Innovations Corp. (2018-2020)
   - Built responsive web applications using React and Node.js
   - Developed RESTful APIs serving 100k+ daily active users
   - Optimized database queries reducing response times by 40%

**Education:**
- Bachelor of Science in Computer Science
- University of the Philippines, 2018

**Certifications:**
- AWS Certified Developer - Associate (2022)
- MongoDB Certified Developer (2021)

**Additional:**
- Has Resume: ✓
- Portfolio: https://mariasantos.dev
- LinkedIn: https://linkedin.com/in/mariasantos

---

### Job Posting

**Title:** Full Stack Developer

**Company:** StartupHub Philippines

**Location:** Makati, Metro Manila

**Job Type:** Full-time

**Salary Range:** ₱80,000 - ₱120,000/month

**Description:**
We are seeking an experienced Full Stack Developer to join our growing team. You will work on cutting-edge web applications using modern technologies, collaborate with cross-functional teams, and help shape our technical direction.

**Requirements:**
- 5+ years of experience with React and Node.js
- Strong TypeScript skills
- Experience with PostgreSQL or similar relational databases
- Knowledge of REST API design and implementation
- Experience with cloud platforms (AWS, GCP, or Azure)
- Strong problem-solving and communication skills
- Bachelor's degree in Computer Science or related field

**Responsibilities:**
- Design and develop scalable web applications
- Write clean, maintainable code following best practices
- Collaborate with product team on feature development
- Participate in code reviews and mentoring
- Optimize application performance and scalability

**Skills Required:**
- React
- Node.js
- TypeScript
- PostgreSQL
- REST APIs
- Git

---

### AI Match Analysis

**Match Score:** 92/100 (Excellent Match)

**AI Reasoning:**

"This is an excellent match between the candidate and the job posting. Here's why:

**Skills Alignment (95%):** The candidate's skillset perfectly aligns with the job requirements. They have strong expertise in React, Node.js, TypeScript, PostgreSQL, Express.js, and REST APIs - all of which are explicitly required or mentioned in the job posting.

**Work Experience (90%):** With 5+ years of full stack development experience, the candidate meets the experience requirement. Their current role as Senior Full Stack Developer at Tech Solutions Inc. demonstrates relevant experience building enterprise web applications with the exact tech stack mentioned in the job posting. Previous role shows progression and scaling experience.

**Education (100%):** Bachelor's degree in Computer Science from University of the Philippines fully meets the educational requirement.

**Certifications (80%):** AWS Certified Developer certification shows cloud platform expertise, which is listed as a requirement. The MongoDB certification, while not directly required, demonstrates commitment to continuous learning.

**Portfolio & Professional Presence (95%):** Having a portfolio website and resume demonstrates professionalism and provides tangible evidence of work quality. The LinkedIn profile adds credibility.

**Location Compatibility (100%):** Candidate is based in Manila, and the job is in Makati (Metro Manila area), making this a perfect location match with minimal commute.

**Career Growth Alignment (90%):** The candidate's progression from Full Stack Developer to Senior Full Stack Developer shows career growth. This role at a startup would provide leadership opportunities and align with their experience level.

**Overall Assessment:** This candidate is exceptionally well-suited for this position. Their technical expertise, experience level, educational background, and professional certifications all strongly align with the job requirements. The location match is ideal, and they demonstrate professionalism through their portfolio and certifications. I would highly recommend proceeding with this candidate."

---

## Example 2: Moderate Match Score (55-65)

### Job Seeker Profile

**Basic Information:**
- Name: Juan Reyes
- Location: Cebu City, Philippines
- Headline: "Junior Web Developer"
- Bio: "Recent computer science graduate passionate about web development. Completed several personal projects using HTML, CSS, JavaScript, and PHP."

**Skills:**
- HTML
- CSS
- JavaScript
- PHP
- MySQL
- jQuery
- Bootstrap

**Work Experience:**
1. **Web Developer Intern** at Local Web Agency (2023, 6 months)
   - Assisted in developing WordPress websites
   - Fixed bugs and implemented minor features
   - Learned basic version control with Git

**Education:**
- Bachelor of Science in Computer Science
- University of San Carlos, 2023

**Certifications:**
- None

**Additional:**
- Has Resume: ✓
- No Portfolio
- No LinkedIn

---

### Job Posting
(Same Full Stack Developer position as Example 1)

---

### AI Match Analysis

**Match Score:** 58/100 (Moderate Match)

**AI Reasoning:**

"This is a moderate match with significant gaps:

**Skills Alignment (40%):** Limited alignment. The candidate knows JavaScript, which is foundational, but lacks experience with React, Node.js, TypeScript, and PostgreSQL - all core requirements. Their PHP and MySQL experience shows database understanding but not with the required stack.

**Work Experience (30%):** The candidate has only 6 months of internship experience, far below the 5+ years requirement. The WordPress focus is different from the enterprise web application development mentioned in the job posting.

**Education (100%):** Computer Science degree meets the educational requirement.

**Certifications (0%):** No relevant certifications. Missing the AWS or cloud platform certifications that would strengthen the application.

**Portfolio & Professional Presence (40%):** Has a resume but lacks portfolio and LinkedIn presence, which reduces ability to demonstrate capabilities.

**Location Compatibility (60%):** Cebu City to Makati requires relocation. While both are in the Philippines, this represents a significant life change.

**Career Growth Alignment (50%):** The candidate shows potential and has the foundational education. However, the experience gap is substantial. This would be a very large step up from an internship role.

**Overall Assessment:** While this candidate has the educational foundation and some basic web development skills, they lack the required experience level and specific technical expertise. This position requires 5+ years with the React/Node.js stack, and the candidate is just starting their career. They would be better suited for a junior developer position focused on learning these technologies, rather than this senior-level role. Not recommended for this specific position, but could be considered for a junior role."

---

**Note on Filtered Matches:** Job seekers will never see recommendations with match scores of 50 or below. Only jobs with scores above 50 are shown, ensuring that only relevant opportunities are presented.

## How the Matching Works

### API Endpoint

**GET /api/jobs/recommended**
- Requires: Job Seeker authentication
- Returns: Array of jobs with AI match scores
- Filters: Only jobs with score > 50 (above 50)
- Sorting: Descending by match score

### Response Format

```json
[
  {
    "id": "job-123",
    "title": "Full Stack Developer",
    "company": "StartupHub Philippines",
    "location": "Makati, Metro Manila",
    "description": "...",
    "requirements": ["5+ years experience...", "..."],
    "skills": ["React", "Node.js", "TypeScript", "PostgreSQL"],
    "jobType": "Full-time",
    "salaryMin": 80000,
    "salaryMax": 120000,
    "aiMatchScore": 92,
    "isActive": true,
    "createdAt": "2025-01-15T10:30:00Z"
  },
  {
    "id": "job-456",
    "title": "Backend Node.js Developer",
    "company": "Tech Corp",
    "location": "Quezon City",
    "aiMatchScore": 78,
    ...
  }
]
```

### What the AI Evaluates

The GPT-5 model intelligently evaluates multiple factors and provides holistic, context-aware scoring. While it doesn't use fixed weights, it typically considers:

1. **Skills & Technical Expertise**
   - Exact skill matches with job requirements
   - Related and transferable skills
   - Depth of technical knowledge

2. **Work Experience**
   - Years of relevant experience
   - Similar roles and responsibilities
   - Industry alignment
   - Career progression patterns

3. **Educational Background**
   - Degree level and field of study
   - Institution relevance
   - Alignment with job requirements

4. **Professional Certifications**
   - Industry-recognized credentials
   - Technology-specific certifications
   - Recency and relevance

5. **Professional Presence**
   - Resume availability (signals professionalism)
   - Portfolio quality
   - LinkedIn profile completeness

6. **Location Factors**
   - Geographic compatibility
   - Commute feasibility
   - Remote work considerations

7. **Career Fit & Growth**
   - Natural career progression
   - Learning opportunity alignment
   - Long-term fit potential

**Important:** The AI dynamically weighs these factors based on each specific job's requirements and context, rather than using predetermined fixed weights. This allows for more nuanced and accurate matching.

---

## Testing the Matching System

### Manual Test via API

1. Create a complete job seeker profile (see Example 1)
2. Create a job posting (see Example 1)
3. Authenticate as the job seeker
4. Call: `GET /api/jobs/recommended`
5. Verify the created job appears with a high match score (> 70)

### Expected Behavior

- **Job Evaluation Limit**: The system evaluates up to 10 active, unflagged jobs to balance match quality with API costs
- **Automatic Filtering**: Only jobs with match scores above 50 are returned (scores of 50 or below are filtered out)
- **Intelligent Sorting**: Results are sorted by match score in descending order (highest matches first)
- **Match Quality Distribution**:
  - High-quality matches (70-100) appear at the top
  - Moderate matches (51-69) appear below
  - Poor matches (50 and below) are completely filtered out

**Note:** If there are more than 10 active jobs in the system, only the first 10 are evaluated. This ensures fast response times while still providing quality recommendations.

---

## Philippine Job Market Context

The AI is specifically trained for the Philippine job market and considers:

- Local salary ranges (in Philippine Pesos)
- Philippine educational institutions
- Regional location preferences (Metro Manila, Cebu, Davao, etc.)
- Common job titles and industry terminology used in the Philippines
- Work culture and career progression patterns
- Remote work trends in the Philippine tech industry

This context ensures more accurate and relevant matching for Filipino job seekers and employers.
