from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from ..constants.roles import UserRole

# -----------------------------------------------------------------------------
# Job Seeker Profile Sub-schemas
# -----------------------------------------------------------------------------
class JobSeekerPersonalSchema(BaseModel):
    full_name: Optional[str] = None
    profile_photo: Optional[str] = None
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = "Prefer not to say"  # Male | Female | Other | Prefer not to say
    mobile_number: Optional[str] = None
    email: Optional[str] = None
    current_city: Optional[str] = None
    current_state: Optional[str] = None
    country: Optional[str] = "India"
    preferred_language: Optional[str] = "Hindi"

class EmploymentStatusSchema(BaseModel):
    status: Optional[str] = None  # Student | Fresher | Working Professional | Self-employed | Currently unemployed | Looking for a career change | Returning to work
    # If Student
    college_name: Optional[str] = None
    course_degree: Optional[str] = None
    branch_specialization: Optional[str] = None
    current_year_semester: Optional[str] = None
    expected_graduation_year: Optional[str] = None
    # If Working Professional
    current_job_title: Optional[str] = None
    current_company: Optional[str] = None
    total_experience_years: Optional[str] = None
    current_industry: Optional[str] = None
    # If Fresher
    graduation_year: Optional[str] = None

class EducationRecordSchema(BaseModel):
    level: Optional[str] = None  # 10th | 12th | Diploma | Undergraduate | Postgraduate | Doctorate
    degree: Optional[str] = None
    specialization: Optional[str] = None
    university: Optional[str] = None
    graduation_year: Optional[str] = None
    status: Optional[str] = "Completed"  # Pursuing | Completed
    certifications: Optional[str] = None

class SkillItemSchema(BaseModel):
    name: str
    category: Optional[str] = "Technical"  # Technical | Non-Technical
    level: Optional[str] = "Intermediate"  # Beginner | Intermediate | Advanced | Expert

class WorkExperienceRecordSchema(BaseModel):
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    employment_type: Optional[str] = "Full-time"  # Full-time | Part-time | Internship | Contract | Freelance | Apprenticeship
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: Optional[bool] = False
    location: Optional[str] = None
    responsibilities: Optional[str] = None
    achievements: Optional[str] = None

class JobPreferencesSchema(BaseModel):
    looking_for: List[str] = []  # Full-time, Part-time, Internship, Freelance, Contract, Apprenticeship
    preferred_roles: List[str] = []
    preferred_industries: List[str] = []
    work_modes: List[str] = []  # Work from Home, Hybrid, On-site
    preferred_cities: List[str] = []
    relocation: Optional[str] = "Maybe"  # Willing to relocate | Not willing to relocate | Maybe
    expected_salary_min: Optional[int] = None
    expected_salary_max: Optional[int] = None
    is_salary_negotiable: Optional[bool] = True

class LanguageRecordSchema(BaseModel):
    language: str
    speaking_level: Optional[str] = "Intermediate"  # Beginner | Intermediate | Advanced | Fluent/Native
    reading_level: Optional[str] = "Intermediate"
    writing_level: Optional[str] = "Intermediate"

class PortfolioLinksSchema(BaseModel):
    resume_url: Optional[str] = None
    resume_filename: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    other_url: Optional[str] = None

class JobSeekerVisibilitySchema(BaseModel):
    visibility: Optional[str] = "public_employers"  # public_employers | applied_only | private
    allow_contact: Optional[bool] = True

class JobSeekerProfileRequest(BaseModel):
    personal: Optional[JobSeekerPersonalSchema] = None
    employment_status: Optional[EmploymentStatusSchema] = None
    education: List[EducationRecordSchema] = []
    skills: List[SkillItemSchema] = []
    has_experience: Optional[bool] = False
    experience: List[WorkExperienceRecordSchema] = []
    preferences: Optional[JobPreferencesSchema] = None
    languages: List[LanguageRecordSchema] = []
    portfolio: Optional[PortfolioLinksSchema] = None
    visibility: Optional[JobSeekerVisibilitySchema] = None

# -----------------------------------------------------------------------------
# Employer Profile Sub-schemas
# -----------------------------------------------------------------------------
class EmployerBusinessInfoSchema(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    year_established: Optional[str] = None
    employee_count: Optional[str] = "1–10"  # 1–10 | 11–50 | 51–200 | 201–500 | 501–1000 | 1000+

class EmployerLocationSchema(BaseModel):
    country: Optional[str] = "India"
    state: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None
    work_model: Optional[str] = "On-site"  # Remote | Hybrid | On-site | Multiple locations

class EmployerRecruiterInfoSchema(BaseModel):
    name: Optional[str] = None
    job_title: Optional[str] = "HR Manager"  # Founder | HR Manager | Recruiter | Hiring Manager | Business Owner
    official_email: Optional[str] = None
    mobile_number: Optional[str] = None
    alternate_contact: Optional[str] = None
    preferred_contact_method: Optional[str] = "Email"  # Email | Phone | WhatsApp

class EmployerHiringInfoSchema(BaseModel):
    hiring_types: List[str] = []  # Full-time employees, Part-time employees, Interns, Freelancers, Contract workers, Apprentices
    categories: List[str] = []  # IT/Software, Sales, Marketing, etc.

class EmployerHiringLocationSchema(BaseModel):
    cities: List[str] = []
    states: List[str] = []
    country: Optional[str] = "India"
    remote_hiring: Optional[bool] = False
    hybrid_hiring: Optional[bool] = False
    onsite_hiring: Optional[bool] = True

class EmployerVerificationSchema(BaseModel):
    status: Optional[str] = "not_verified"  # not_verified | email_verified | pending | verified | rejected
    gstin: Optional[str] = None
    cin: Optional[str] = None
    registration_number: Optional[str] = None
    official_website: Optional[str] = None
    official_email: Optional[str] = None

class EmployerCompanyProfileSchema(BaseModel):
    description: Optional[str] = None
    mission: Optional[str] = None
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    social_links: List[str] = []
    benefits: List[str] = []
    work_culture: Optional[str] = None

class EmployerHiringPreferencesSchema(BaseModel):
    candidate_experience: Optional[str] = "Fresher"  # Fresher | 0–1 years | 1–3 years | 3–5 years | 5+ years
    preferred_education: List[str] = []
    preferred_skills: List[str] = []
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    discuss_during_hiring: Optional[bool] = True

class EmployerVisibilitySchema(BaseModel):
    visibility: Optional[str] = "public"  # public | registered_only | hidden
    allow_contact: Optional[bool] = True

class EmployerProfileRequest(BaseModel):
    business_type: Optional[str] = "Private Company"
    business_info: Optional[EmployerBusinessInfoSchema] = None
    location: Optional[EmployerLocationSchema] = None
    recruiter_info: Optional[EmployerRecruiterInfoSchema] = None
    hiring_info: Optional[EmployerHiringInfoSchema] = None
    hiring_location: Optional[EmployerHiringLocationSchema] = None
    verification: Optional[EmployerVerificationSchema] = None
    company_profile: Optional[EmployerCompanyProfileSchema] = None
    hiring_preferences: Optional[EmployerHiringPreferencesSchema] = None
    visibility: Optional[EmployerVisibilitySchema] = None

# -----------------------------------------------------------------------------
# Completion & Legacy Profile Requests
# -----------------------------------------------------------------------------
class ProfileCompletionBreakdown(BaseModel):
    percentage: int
    completed_sections: List[str]
    missing_sections: List[str]
    is_ready_for_matching: bool

class ProfileCreateUpdateRequest(BaseModel):
    user_type: str = Field(..., description="Either 'job_seeker' or 'employer'")
    age: Optional[int] = Field(None, ge=18, le=100, description="User age, minimum 18")
    profession: Optional[str] = Field(None, description="Selected profession / trade")
    custom_profession: Optional[str] = Field(None, description="Custom profession if 'Other'")
    # Allow full nested payloads if submitted through single endpoint
    job_seeker_data: Optional[Dict[str, Any]] = None
    employer_data: Optional[Dict[str, Any]] = None

class SwitchRoleRequest(BaseModel):
    role: UserRole = Field(..., description="Target role: worker or employer")

class UserDataSaveRequest(BaseModel):
    data: Dict[str, Any] = Field(..., description="User workspace/saved state data")

class UserResponse(BaseModel):
    id: str
    user_id: str
    uid: str
    email: str
    username: str
    name: str
    mobile_number: Optional[str] = None
    role: str
    account_type: Optional[str] = None
    profile_completed: bool
    age: Optional[int] = None
    worker_profile: Optional[Dict[str, Any]] = None
    employer_profile: Optional[Dict[str, Any]] = None
    job_seeker_profile: Optional[Dict[str, Any]] = None
    profile: Optional[Dict[str, Any]] = None
    completion_percentage: Optional[int] = 0
    saved_data: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
