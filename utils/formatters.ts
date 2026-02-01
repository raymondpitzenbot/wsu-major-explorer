
const degreeTypeMap: Record<string, string> = {
    'BS': 'Bachelor of Science',
    'BA': 'Bachelor of Arts',
    'BM': 'Bachelor of Music',
    'BSW': 'Bachelor of Social Work',
    'BT': 'Bachelor of Teaching',
    'BAS': 'Bachelor of Applied Science',
    'AA': 'Associate of Arts',
    'GC': 'Graduate Certificate',
    'MA': 'Master of Arts',
    'MS': 'Master of Science',
    'EdD': 'Doctor of Education',
    'DNP': 'Doctor of Nursing Practice',
    'EdS': 'Education Specialist',
    'MSW': 'Master of Social Work',
};

export const expandDegreeType = (degreeType: string): string => {
    return degreeTypeMap[degreeType] || degreeType;
};
