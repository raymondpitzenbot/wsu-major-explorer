

import OpenAI from "openai";
import type { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "@upstash/redis";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const AI_ENABLED = process.env.AI_ENABLED ?? "true";

const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 15);
const MAX_INPUT_CHARS = Number(process.env.MAX_INPUT_CHARS ?? 1000);
const MAX_OUTPUT_TOKENS = Number(process.env.MAX_OUTPUT_TOKENS ?? 200); // Reduced from 300
const MAX_HISTORY_MESSAGES = Number(process.env.MAX_HISTORY_MESSAGES ?? 3); // Reduced from 5
const MAX_HISTORY_MSG_CHARS = Number(process.env.MAX_HISTORY_MSG_CHARS ?? 1000); // Reduced from 1500

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

let redis: Redis | null = null;
try {
  if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({ url: UPSTASH_REDIS_REST_URL, token: UPSTASH_REDIS_REST_TOKEN });
  }
} catch (e) {
  console.error("Failed to initialize Redis:", e);
}

function getClientIp(req: NextApiRequest) {
  const xf = req.headers["x-forwarded-for"];
  const first = (Array.isArray(xf) ? xf[0] : xf ?? "").split(",")[0].trim();
  return first || req.socket.remoteAddress || "unknown";
}

/**
 * Rate limiter: 15 requests per day per IP address
 * - Uses Redis for persistent storage (survives server restarts)
 * - IP-based tracking (cannot be bypassed by clearing browser data)
 * - Resets daily at midnight UTC
 * - Returns false if limit exceeded, true if request is allowed
 */
async function applyRateLimiter(req: NextApiRequest): Promise<boolean> {
  if (!redis) return true;
  const ip = getClientIp(req);
  if (ip === "unknown") return true;
  const dayKey = new Date().toISOString().slice(0, 10);
  const key = `rate_limit:${ip}:${dayKey}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60 * 60 * 24);
  return count <= RATE_LIMIT_MAX_REQUESTS;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("API Handler Start. Method:", req.method);
  console.log("OpenAI Key Present:", !!OPENAI_API_KEY);
  console.log("Redis Present:", !!redis);

  if (!openai) {
    console.error("OPENAI_API_KEY is missing from environment variables.");
    return res.status(500).json({
      error: "The AI Advisor is not configured correctly on the server. Please ensure OPENAI_API_KEY is set in the Vercel project settings."
    });
  }

  if (AI_ENABLED !== "true") {
    return res.status(503).json({ error: "The AI Advisor is temporarily disabled." });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    if (!(await applyRateLimiter(req))) {
      return res.status(429).json({ error: "Daily message limit exceeded. Please try again tomorrow." });
    }

    const { chatHistory, userQuery, programContext, professorContext, wsuStats } = req.body;

    if (!userQuery || typeof userQuery !== "string" || !Array.isArray(chatHistory)) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    // Smart cache: Normalize queries to catch common variations
    const normalizeQuery = (query: string): string => {
      return query
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ')     // Normalize spaces
        .trim()
        .replace(/winona state university|wsu|winona state/gi, 'wsu') // Normalize school name
        .replace(/how much does|what does|whats the cost|what is the cost/gi, 'cost')
        .replace(/tuition|fees|price/gi, 'cost');
    };

    // Check cache with normalized query
    if (redis) {
      try {
        const normalizedQuery = normalizeQuery(userQuery);
        const cacheKey = `chat_cache:${Buffer.from(normalizedQuery).toString('base64').slice(0, 40)}`;
        const cached = await redis.get<string>(cacheKey);
        if (cached) {
          console.log(`Cache hit for: ${normalizedQuery}`);
          return res.status(200).json({ text: cached });
        }
      } catch (e) {
        console.error("Cache get error:", e);
      }
    }

    if (userQuery.length > MAX_INPUT_CHARS) {
      return res.status(413).json({ error: `Message too long.` });
    }

    // Build context with WSU statistics
    let contextSnippet = "";
    if (wsuStats) {
      contextSnippet = `\n\nWSU Quick Facts:\n` +
        `- Total Programs: ${wsuStats.total_programs}\n` +
        `- Bachelor's Degrees: ${wsuStats.bachelor_programs}\n` +
        `- Minors: ${wsuStats.minor_programs}\n` +
        `- Master's Programs: ${wsuStats.master_programs}\n` +
        `- Total Professors: ${wsuStats.total_professors}`;
    }

    // Only add program context if programs were found
    if (programContext && Array.isArray(programContext) && programContext.length > 0) {
      contextSnippet += "\n\nRelevant WSU Programs:\n" +
        programContext.map((p: any) =>
          `- ${p.program_name} (${p.degree_type}): ${p.program_credits || 'varies'} credits. ${p.short_description || ''}`
        ).join("\n");
    }

    // Only add professor context if professors were found
    if (professorContext && Array.isArray(professorContext) && professorContext.length > 0) {
      contextSnippet += "\n\nRelevant WSU Professors:\n" +
        professorContext.map((prof: any) =>
          `- ${prof.name} (${prof.title}): Rating ${prof.avg_rating}/5 (${prof.num_ratings} reviews), ${prof.would_take_again_percent}% would retake. Courses: ${prof.courses_taught}`
        ).join("\n");
    }

    const trimmedHistory = chatHistory
      .slice(-MAX_HISTORY_MESSAGES)
      .map((msg: any) => {
        const text = msg?.parts?.[0]?.text ?? "";
        const role = (msg?.role === "model" ? "assistant" : "user") as "assistant" | "user";
        return { role, content: String(text).slice(0, MAX_HISTORY_MSG_CHARS) };
      });

    const systemInstruction =
      `You are Warrior Bot, WSU's AI advisor. Help students explore programs using the data below. ` +
      `PRIORITY: Use WSU data provided over your general knowledge. For info not in the data (tuition, deadlines), use web_search. ` +
      `Programs data: Use exact credits/details. Professor data: ONLY mention listed professors - admit when you lack info. ` +
      `Occasionally suggest consulting a WSU advisor. Plain text only, no markdown.` +
      contextSnippet;

    const tools = [
      {
        type: "function" as const,
        function: {
          name: "web_search",
          description: "Searches the web for current information about Winona State University. Use this when asked about information not in the provided WSU data, such as tuition costs, admission requirements, campus events, deadlines, etc.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The search query. Include 'Winona State' or 'WSU' to get WSU-specific results."
              }
            },
            required: ["query"]
          }
        }
      }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemInstruction },
        ...trimmedHistory,
        { role: "user", content: userQuery },
      ],
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0.7,
      tools,
      tool_choice: "auto"
    });

    let responseText = completion.choices[0]?.message?.content ?? "";
    const toolCalls = completion.choices[0]?.message?.tool_calls;

    // Handle web search function call
    if (toolCalls && toolCalls.length > 0) {
      const searchCall = toolCalls[0];
      if (searchCall.function.name === "web_search") {
        const args = JSON.parse(searchCall.function.arguments);
        const searchQuery = args.query;

        if (TAVILY_API_KEY) {
          try {
            // Call Tavily Search API
            const tavilyResponse = await fetch("https://api.tavily.com/search", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                api_key: TAVILY_API_KEY,
                query: searchQuery,
                search_depth: "basic",
                include_answer: true,
                max_results: 3
              })
            });

            if (tavilyResponse.ok) {
              const searchResults = await tavilyResponse.json();

              // Format search results for the AI
              const searchContext = searchResults.answer ||
                (searchResults.results?.slice(0, 3).map((r: any) => `${r.title}: ${r.content}`).join("\n\n") ||
                  "No results found.");

              // Make a second API call with the search results
              const followUp = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                  { role: "system", content: systemInstruction },
                  ...trimmedHistory,
                  { role: "user", content: userQuery },
                  { role: "assistant", content: null, tool_calls: [searchCall] },
                  { role: "tool", content: searchContext, tool_call_id: searchCall.id }
                ],
                max_tokens: MAX_OUTPUT_TOKENS,
                temperature: 0.7
              });

              responseText = followUp.choices[0]?.message?.content || "I found some information but couldn't process it properly.";
            } else {
              responseText = "I tried to search for that information but encountered an error. For current details about tuition and costs, please visit winona.edu.";
            }
          } catch (error) {
            console.error("Tavily search error:", error);
            responseText = "I wasn't able to search for that information right now. For current details, please visit the official Winona State website at winona.edu.";
          }
        } else {
          // No Tavily API key configured
          responseText = `For current information about ${searchQuery.toLowerCase()}, I recommend visiting the official Winona State University website at winona.edu or contacting the admissions office directly.`;
        }
      }
    } else if (!responseText) {
      responseText = "I'm sorry, I couldn't process that.";
    }

    // Smart cache storage with longer TTL for common patterns
    if (redis && responseText) {
      try {
        const normalizedQuery = normalizeQuery(userQuery);
        const cacheKey = `chat_cache:${Buffer.from(normalizedQuery).toString('base64').slice(0, 40)}`;

        // Longer cache for common question patterns (24 hours vs 1 hour)
        const isCommonQuestion = /cost|tuition|fees|admission|deadline|program|major|housing|financial aid/i.test(normalizedQuery);
        const ttl = isCommonQuestion ? 60 * 60 * 24 : 60 * 60; // 24h for common, 1h for specific

        await redis.set(cacheKey, responseText, { ex: ttl });
        console.log(`Cached response for: ${normalizedQuery} (TTL: ${ttl}s)`);
      } catch (e) {
        console.error("Cache set error:", e);
      }
    }

    return res.status(200).json({ text: responseText });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    // Return the actual error message if possible for debugging
    const message = error instanceof Error ? error.message : "An internal server error occurred.";
    return res.status(500).json({ error: `Server Error: ${message}` });
  }
}
