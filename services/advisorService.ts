// 1. Cache for common, non-program-related queries to provide instant, zero-cost responses.
const COMMON_QUERIES_CACHE = new Map<string, string>([
    ['hello', "Hi there! I'm Warrior Bot. How can I help you explore WSU majors today?"],
    ['hi', "Hi there! I'm Warrior Bot. How can I help you explore WSU majors today?"],
    ['hey', "Hey! I'm Warrior Bot. How can I help you explore WSU majors today?"],
    ['what can you do', "I can help you find information about majors at WSU, compare them, or answer general questions about college life. What are you interested in?"],
    ['thanks', "You're welcome! Is there anything else I can help you with?"],
    ['thank you', "You're welcome! Let me know if you have more questions."],
]);

/**
 * Sends a user query to the backend server endpoint for a response.
 * The server handles rate limiting and secure communication with the AI API.
 * @param chatHistory The existing chat history.
 * @param userQuery The new query from the user.
 * @returns A promise that resolves to the AI's string response.
 */
export const getAdvisorResponse = async (chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[], userQuery: string): Promise<string> => {
    // Check local cache first for an instant, free response for common phrases
    const normalizedQuery = userQuery.trim().toLowerCase().replace(/[^\w\s]/g, '');
    if (COMMON_QUERIES_CACHE.has(normalizedQuery)) {
        return COMMON_QUERIES_CACHE.get(normalizedQuery)!;
    }

    try {
        const response = await fetch("http://localhost:3001/api/chat", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ chatHistory, userQuery }),
        });

        if (response.status === 429) {
            // Rate limit error specifically from our server
             const errorData = await response.json().catch(() => ({ error: "You've reached the message limit for today. Please try again tomorrow." }));
            return errorData.error;
        }

        if (!response.ok) {
            // Handle other server or network errors
            const errorData = await response.json().catch(() => ({}));
            console.error("Error fetching from /api/chat:", response.status, errorData.error);
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const data = await response.json();
        return data.text || "I'm sorry, I couldn't get a proper response. Please try again.";

    } catch (error) {
        console.error("Error in getAdvisorResponse:", error);
        return "I'm sorry, I encountered a connection error. Please check your network and try again. If the problem persists, please contact a WSU advisor directly.";
    }
};
