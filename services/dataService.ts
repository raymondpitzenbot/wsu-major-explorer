
import { Program, Department } from '../types';
import { departments, programsRaw, programEnrollments, programGraduates, careerOutcomes, clubs, dataSources } from '../data/wsuData';
import { expandDegreeType } from '../utils/formatters';

let fullProgramData: Program[] | null = null;
let rankedDepartments: Department[] | null = null;

const getRankedDepartments = (): Department[] => {
    if (rankedDepartments) {
        return rankedDepartments;
    }
    const sortedByEnrollment = [...departments]
        .filter(d => d.total_enrollment_fall_2021 != null)
        .sort((a, b) => (b.total_enrollment_fall_2021 || 0) - (a.total_enrollment_fall_2021 || 0));

    const withRank = sortedByEnrollment.map((dept, index) => ({ ...dept, rank: index + 1 }));

    // Create a map to add ranks back to the original, alphabetically sorted list
    const rankMap = new Map(withRank.map(d => [d.department_id, d.rank]));
    const finalDepartments = [...departments]
        .map(d => ({ ...d, rank: rankMap.get(d.department_id) }))
        .sort((a, b) => a.department_name.localeCompare(b.department_name));

    rankedDepartments = finalDepartments;
    return rankedDepartments;
}

const joinData = (): Program[] => {
    const departmentsWithRank = getRankedDepartments();
    const departmentsMap = new Map(departmentsWithRank.map(d => [d.department_id, d]));
    const enrollmentsMap = new Map(programEnrollments.map(e => [e.program_id, e]));
    const graduatesMap = new Map(programGraduates.map(g => [g.program_id, g]));

    const outcomesByProgram = new Map<string, any[]>();
    careerOutcomes.forEach(outcome => {
        if (!outcomesByProgram.has(outcome.program_id)) {
            outcomesByProgram.set(outcome.program_id, []);
        }
        outcomesByProgram.get(outcome.program_id)?.push(outcome);
    });

    const clubsByCollege = new Map<string, any[]>();
    clubs.forEach(club => {
        if (!clubsByCollege.has(club.college_name)) {
            clubsByCollege.set(club.college_name, []);
        }
        clubsByCollege.get(club.college_name)?.push(club);
    });

    return programsRaw.map(p => {
        const department = departmentsMap.get(p.department_id);
        const enrollment = enrollmentsMap.get(p.program_id);
        const graduates = graduatesMap.get(p.program_id);
        const outcomes = outcomesByProgram.get(p.program_id) || [];

        // Find most relevant clubs
        const collegeClubs = department ? clubsByCollege.get(department.college_name) || [] : [];
        const programNameWords = p.program_name.toLowerCase().split(/[\s,/-]+/).filter(w => w.length > 2);
        const stopWords = ['club', 'association', 'society', 'winona', 'state', 'wsu', 'the', 'and', 'for', 'international', 'student', 'professional'];

        const relatedClubs = collegeClubs
            .map(club => {
                const clubNameWords = club.club_name.toLowerCase().split(/[\s,/-]+/).filter(w => w.length > 2);
                const score = clubNameWords.filter(w => !stopWords.includes(w) && programNameWords.includes(w)).length;
                return { club, score };
            })
            .sort((a, b) => b.score - a.score || a.club.club_name.localeCompare(b.club.club_name))
            .slice(0, 3)
            .map(item => item.club);

        let score = 0;
        if (enrollment) score++;
        if (graduates) score++;
        if (outcomes.length > 0) score++;
        if (relatedClubs.length > 0) score++;

        return {
            ...p,
            department: department,
            expanded_degree_type: expandDegreeType(p.degree_type),
            enrollment_fall_2021: enrollment ? enrollment.enrollment_fall_2021 : null,
            enrollment_trend: enrollment ? enrollment.trend : null,
            graduates_total: graduates ? graduates.graduates_total : null,
            career_outcomes: outcomes,
            clubs: relatedClubs,
            data_coverage_score: score,
        };
    }).sort((a, b) => a.program_name.localeCompare(b.program_name));
};

export const getAllPrograms = (): Program[] => {
    if (!fullProgramData) {
        fullProgramData = joinData();
    }
    return fullProgramData;
};

export const getProgramById = (programId: string): Program | undefined => {
    return getAllPrograms().find(p => p.program_id === programId);
};

export const getDepartments = () => {
    return getRankedDepartments();
}

export const getColleges = () => {
    const collegeNames = new Set(departments.map(d => d.college_name));
    return Array.from(collegeNames).sort();
}

export const getDegreeTypes = () => {
    if (!fullProgramData) {
        fullProgramData = joinData();
    }
    const degreeTypes = new Set(fullProgramData.map(p => p.expanded_degree_type || p.degree_type));
    return Array.from(degreeTypes).sort();
}

export const getLocations = () => {
    const locations = new Set<string>();
    programsRaw.forEach(p => {
        p.location.split(';').forEach(loc => locations.add(loc.trim()));
    });
    return Array.from(locations).sort();
}

export const getCredentialLevels = (): string[] => {
    const credentialLevels = new Set(programsRaw.map(p => p.credential_level));
    return Array.from(credentialLevels).sort();
};


export { dataSources, clubs };
