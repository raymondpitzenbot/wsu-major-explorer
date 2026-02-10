
export interface Department {
    department_id: string;
    department_name: string;
    college_name: string;
    total_enrollment_fall_2021?: number;
    rank?: number;
}

export interface Program {
    program_id: string;
    program_name: string;
    degree_type: string;
    credential_level: string;
    department_id: string;
    program_credits: string;
    total_credits: string;
    location: string;
    program_page_url: string;
    description?: string;
    short_description?: string;
    overview?: string;
    you_might_like?: string[];
    not_for_you?: string[];
    related_job_titles?: string[];
    recommended_minors?: { name: string; id: string }[];
    catalog_year?: string;
    academic_year?: string;


    department?: Department;
    expanded_degree_type?: string;
    enrollment_fall_2021?: number | null;
    enrollment_trend?: 'Up' | 'Stable' | 'Down' | null;
    graduates_total?: number | null;
    career_outcomes?: CareerOutcome[];
    clubs?: Club[];
    data_coverage_score?: number;
    course_structure?: CourseGroup[];
    tags?: string[];
}

export interface Course {
    course_id: string;
    course_title: string;
    credits: string;
    description?: string;
}


export interface CourseGroup {
    group_name: string;
    credits_required?: string;

    display_type?: 'list' | 'choice_credits' | 'choice_count';
    items: (Course | CourseText)[];
    subgroups?: CourseGroup[];
    notes?: string[];
}

export interface CourseText {
    type: 'text';
    content: string;
}

export interface Course {
    type: 'course';
    course_id: string;
    course_title: string;
    credits: string;
    description?: string;
}

export interface CareerOutcome {
    occupation_code: string;
    occupation_title: string;
    median_wage_mn: number | null;
    median_salary_mn: number | null;
    growth_rate_10yr_mn: string | null;
    source_id: string;
    occupation_data_url: string;
}

export interface Club {
    club_id: string;
    club_name: string;
    college_name: string;
    club_url: string;
}

export interface DataSource {
    source_id: string;
    source_name: string;
    source_year: string;
    source_notes: string;
    source_url: string;
}
