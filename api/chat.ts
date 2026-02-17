

import OpenAI from "openai";
import type { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "@upstash/redis";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const AI_ENABLED = process.env.AI_ENABLED ?? "true";

const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 15);
const MAX_INPUT_CHARS = Number(process.env.MAX_INPUT_CHARS ?? 1000);
const MAX_OUTPUT_TOKENS = Number(process.env.MAX_OUTPUT_TOKENS ?? 300);
const MAX_HISTORY_MESSAGES = Number(process.env.MAX_HISTORY_MESSAGES ?? 5);
const MAX_HISTORY_MSG_CHARS = Number(process.env.MAX_HISTORY_MSG_CHARS ?? 1500);

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

    // Check Cache first
    if (redis) {
      try {
        const cacheKey = `chat_cache:${Buffer.from(userQuery).toString('base64').slice(0, 32)}`;
        const cached = await redis.get<string>(cacheKey);
        if (cached) {
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
        `- Master's Programs: ${wsuStats.master_programs}`;
    }

    // Build context snippet from frontend-provided programs
    if (programContext && Array.isArray(programContext) && programContext.length > 0) {
      contextSnippet += "\n\nRelevant WSU Programs:\n" +
        programContext.slice(0, 5).map((p: any) =>
          `- ${p.program_name} (${p.degree_type}): ${p.program_credits || 'varies'} credits. ${p.short_description || ''}`
        ).join("\n");
    }

    // Build professor context snippet from frontend-provided professors
    if (professorContext && Array.isArray(professorContext) && professorContext.length > 0) {
      contextSnippet += "\n\nRelevant WSU Professors:\n" +
        professorContext.slice(0, 5).map((prof: any) =>
          `- ${prof.name} (${prof.title}): RateMyProfessor rating ${prof.avg_rating}/5 based on ${prof.num_ratings} reviews, ${prof.would_take_again_percent}% would take again. Teaches: ${prof.courses_taught?.join(', ') || 'N/A'}`
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
      `You are "Warrior Bot," a friendly AI assistant for Winona State University. ` +
      `Your goal is to help students explore academic programs at WSU. ` +
      `Below you'll find WSU statistics, program details, and professor information that may be relevant to the user's question. ` +
      `PRIORITY RULE: Always prioritize the specific WSU data provided below over your general knowledge. If WSU-specific information is available, use it exclusively. Only fall back to general knowledge if no relevant WSU data is provided. ` +
      `Use your intelligence to determine which information is actually relevant - not everything provided will apply to every question. ` +
      `When answering about programs, use the specific details provided (credits, descriptions). ` +
      `When answering about professors, ONLY mention those listed below - if none are listed or relevant, say so honestly. Never make up professor names or information. ` +
      `Occasionally (not every message) remind users that they should consult with an official WSU academic advisor for personalized guidance. ` +
      `Return PLAIN TEXT ONLY. NO MARKDOWN. NO BOLDING.` +
      contextSnippet;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemInstruction },
        ...trimmedHistory,
        { role: "user", content: userQuery },
      ],
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content ?? "I'm sorry, I couldn't process that.";

    // Simple cache for identical queries (1 hour TTL)
    if (redis) {
      try {
        const cacheKey = `chat_cache:${Buffer.from(userQuery).toString('base64').slice(0, 32)}`;
        await redis.set(cacheKey, responseText, { ex: 3600 });
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
