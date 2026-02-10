


import OpenAI from "openai";
import type { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "@upstash/redis";
import { programsRaw, interestMappings } from "../data/wsuData";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const AI_ENABLED = process.env.AI_ENABLED ?? "true";

const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 15);
const MAX_INPUT_CHARS = Number(process.env.MAX_INPUT_CHARS ?? 1000);
const MAX_OUTPUT_TOKENS = Number(process.env.MAX_OUTPUT_TOKENS ?? 300);
const MAX_HISTORY_MESSAGES = Number(process.env.MAX_HISTORY_MESSAGES ?? 5);
const MAX_HISTORY_MSG_CHARS = Number(process.env.MAX_HISTORY_MSG_CHARS ?? 1500);

if (!OPENAI_API_KEY) {
  throw new Error("OpenAI API key (OPENAI_API_KEY) not found on the server.");
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

let redis: Redis | null = null;
if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({ url: UPSTASH_REDIS_REST_URL, token: UPSTASH_REDIS_REST_TOKEN });
} else {
  console.warn("Upstash Redis environment variables not set. Rate limiting and caching will be limited.");
}

function getClientIp(req: NextApiRequest) {
  const xf = req.headers["x-forwarded-for"];
  const first = (Array.isArray(xf) ? xf[0] : xf ?? "").split(",")[0].trim();
  return first || req.socket.remoteAddress || "unknown";
}

async function applyRateLimiter(req: NextApiRequest): Promise<boolean> {
  if (!redis) return true; // Fail open if no redis for now, or true to block? User might prefer open for dev.
  const ip = getClientIp(req);
  if (ip === "unknown") return true;
  const dayKey = new Date().toISOString().slice(0, 10);
  const key = `rate_limit:${ip}:${dayKey}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60 * 60 * 24);
  return count <= RATE_LIMIT_MAX_REQUESTS;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (AI_ENABLED !== "true") {
    return res.status(503).json({ error: "The AI Advisor is temporarily disabled." });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!(await applyRateLimiter(req))) {
    return res.status(429).json({ error: "Daily message limit exceeded. Please try again tomorrow." });
  }

  try {
    const { chatHistory, userQuery } = req.body;

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

    // Hybrid Context Lookup: Search for relevant programs based on keywords
    const lowerQuery = userQuery.toLowerCase();
    const matchedPrograms = programsRaw.filter(p => {
      const nameMatch = p.program_name.toLowerCase().includes(lowerQuery);
      const keywordMatch = Object.values(interestMappings).some(interest =>
        interest.keywords.some(kw => lowerQuery.includes(kw) && p.program_name.toLowerCase().includes(kw))
      );
      return nameMatch || keywordMatch;
    }).slice(0, 5); // Limiting context to keep costs low

    const contextSnippet = matchedPrograms.length > 0
      ? "\n\nRelevant WSU Programs to consider:\n" + matchedPrograms.map(p => `- ${p.program_name}: ${p.short_description}`).join("\n")
      : "";

    const trimmedHistory = chatHistory
      .slice(-MAX_HISTORY_MESSAGES)
      .map((msg: any) => {
        const text = msg?.parts?.[0]?.text ?? "";
        const role = (msg?.role === "model" ? "assistant" : "user") as "assistant" | "user";
        return { role, content: String(text).slice(0, MAX_HISTORY_MSG_CHARS) };
      });

    const systemInstruction =
      `You are "Warrior Bot," a friendly AI assistant for Winona State University. ` +
      `Your goal is to help students explore academic programs. ` +
      `Use the following context if relevant to provide accurate answers. ` +
      `Always be encouraging and remind users to speak with an official WSU advisor. ` +
      `Return PLAIN TEXT ONLY. NO MARKDOWN. NO BOLDING.**` +
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
  } catch (error) {
    console.error("Error in /api/chat:", error);
    return res.status(500).json({ error: "An internal server error occurred." });
  }
}
