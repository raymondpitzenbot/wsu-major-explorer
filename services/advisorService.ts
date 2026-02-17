
import { programsRaw, interestMappings } from '../data/wsuData';
import professorsData from '../data/professors_data.json';

const COMMON_QUERIES_CACHE = new Map<string, string>([
    ['hello', "Hi there! I'm Warrior Bot. How can I help you explore WSU majors today?"],
    ['hi', "Hi there! I'm Warrior Bot. How can I help you explore WSU majors today?"],
    ['hey', "Hey! I'm Warrior Bot. How can I help you explore WSU majors today?"],
    ['what can you do', "I can help you find information about majors at WSU, compare them, or answer general questions about college life. What are you interested in?"],
    ['thanks', "You're welcome! Is there anything else I can help you with?"],
    ['thank you', "You're welcome! Let me know if you have more questions."],
]);

// Flatten the professors data for easier searching
const allProfessors = Object.values(professorsData).flat();

export const getAdvisorResponse = async (chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[], userQuery: string): Promise<string> => {

    const normalizedQuery = userQuery.trim().toLowerCase().replace(/[^\w\s]/g, '');
    if (COMMON_QUERIES_CACHE.has(normalizedQuery)) {
        return COMMON_QUERIES_CACHE.get(normalizedQuery)!;
    }

    // Search for relevant programs based on the user's query
    const lowerQuery = userQuery.toLowerCase();
    const matchedPrograms = programsRaw.filter(p => {
        const nameMatch = p.program_name.toLowerCase().includes(lowerQuery);
        const keywordMatch = Object.values(interestMappings).some(interest =>
            interest.keywords.some(kw => lowerQuery.includes(kw))
        );
        const degreeTypeMatch = lowerQuery.includes(p.degree_type.toLowerCase());
        return nameMatch || keywordMatch || degreeTypeMatch;
    }).slice(0, 5); // Limit to 5 most relevant programs

    // Search for relevant professors based on the user's query
    const matchedProfessors = allProfessors.filter((prof: any) => {
        const nameMatch = prof.name.toLowerCase().includes(lowerQuery);
        const courseMatch = prof.courses_taught?.some((course: string) =>
            lowerQuery.includes(course.toLowerCase())
        );
        return nameMatch || courseMatch;
    }).slice(0, 5); // Limit to 5 most relevant professors

    // Generate WSU statistics for general queries
    const wsuStats = {
        total_programs: programsRaw.length,
        bachelor_programs: programsRaw.filter(p => p.degree_type.includes('BS') || p.degree_type.includes('BA') || p.degree_type.includes('BFA') || p.degree_type.includes('BSW')).length,
        minor_programs: programsRaw.filter(p => p.degree_type.includes('minor')).length,
        master_programs: programsRaw.filter(p => p.degree_type.includes('MS') || p.degree_type.includes('MA') || p.degree_type.includes('MBA')).length,
    };

    try {
        const response = await fetch("/api/chat", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chatHistory,
                userQuery,
                wsuStats,
                programContext: matchedPrograms.map(p => ({
                    program_name: p.program_name,
                    degree_type: p.degree_type,
                    program_credits: p.program_credits,
                    short_description: p.short_description,
                    total_credits: p.total_credits,
                })),
                professorContext: matchedProfessors.map((prof: any) => ({
                    name: prof.name,
                    title: prof.title,
                    avg_rating: prof.avg_rating,
                    num_ratings: prof.num_ratings,
                    would_take_again_percent: prof.would_take_again_percent,
                    courses_taught: prof.courses_taught?.slice(0, 10), // Limit courses for token usage
                }))
            }),
        });

        if (response.status === 429) {

            const errorData = await response.json().catch(() => ({ error: "You've reached the message limit for today. Please try again tomorrow." }));
            return errorData.error;
        }

        if (!response.ok) {

            const errorData = await response.json().catch(() => ({}));
            console.error("Error fetching from /api/chat:", response.status, errorData.error);
            // Throw the specific error message from the API if available
            throw new Error(errorData.error || `Server responded with status: ${response.status}`);
        }

        const data = await response.json();
        return data.text || "I'm sorry, I couldn't get a proper response. Please try again.";

    } catch (error) {
        console.error("Error in getAdvisorResponse:", error);
        return "I'm sorry, I encountered a connection error. Please check your network and try again. If the problem persists, please try again later.";
    }
};
