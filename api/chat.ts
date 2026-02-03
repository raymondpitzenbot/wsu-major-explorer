// Note: This file is deployed as a serverless function (Next.js API route).
// It acts as a secure backend proxy to the OpenAI API.

import OpenAI from "openai";
import type { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "@upstash/redis";

// --- ENVIRONMENT VARIABLE CONFIGURATION & CHECKS ---
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const AI_ENABLED = process.env.AI_ENABLED ?? "true";

// Security & Cost-Control Limits from Environment Variables
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 15);
const MAX_INPUT_CHARS = Number(process.env.MAX_INPUT_CHARS ?? 1000);
const MAX_OUTPUT_TOKENS = Number(process.env.MAX_OUTPUT_TOKENS ?? 250);
const MAX_HISTORY_MESSAGES = Number(process.env.MAX_HISTORY_MESSAGES ?? 8);
const MAX_HISTORY_MSG_CHARS = Number(process.env.MAX_HISTORY_MSG_CHARS ?? 2000);

if (!OPENAI_API_KEY) {
  throw new Error("OpenAI API key (OPENAI_API_KEY) not found on the server.");
}

// --- AI & DATABASE INITIALIZATION ---
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

let redis: Redis | null = null;
if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({ url: UPSTASH_REDIS_REST_URL, token: UPSTASH_REDIS_REST_TOKEN });
} else {
  console.warn("Upstash Redis environment variables not set. Rate limiting will be enabled (fail-closed => blocks).");
}

// --- UTILITY FUNCTIONS ---
function getClientIp(req: NextApiRequest) {
  const xf = req.headers["x-forwarded-for"];
  const first = (Array.isArray(xf) ? xf[0] : xf ?? "").split(",")[0].trim();
  return first || req.socket.remoteAddress || "unknown";
}

// --- PRODUCTION-GRADE RATE LIMITER ---
async function applyRateLimiter(req: NextApiRequest): Promise<boolean> {
  // Fail-closed for safety. If Redis isn't configured, block requests.
  if (!redis) return false;

  const ip = getClientIp(req);
  if (ip === "unknown") return true; // Don't block if we can't get an IP

  // Calendar-day key (UTC).
  const dayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const key = `rate_limit:${ip}:${dayKey}`;

  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60 * 60 * 24);

  return count <= RATE_LIMIT_MAX_REQUESTS;
}

// --- API HANDLER ---
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1) Kill Switch Check
  if (AI_ENABLED !== "true") {
    return res.status(503).json({ error: "The AI Advisor is temporarily disabled." });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 2) Rate Limiting (by requests)
  if (!(await applyRateLimiter(req))) {
    return res.status(429).json({ error: "Daily message limit exceeded. Please try again tomorrow." });
  }

  try {
    const { chatHistory, userQuery } = req.body;

    if (!userQuery || typeof userQuery !== "string" || !Array.isArray(chatHistory)) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    // 3) Input size limit
    if (userQuery.length > MAX_INPUT_CHARS) {
      return res
        .status(413)
        .json({ error: `Your message is too long. Please keep it under ${MAX_INPUT_CHARS} characters.` });
    }

    // 4) Chat history capping (cost control)
    // Your frontend appears to send Gemini-shaped messages: { role: "user"|"model", parts: [{text}] }
    // We convert them to OpenAI roles: "user"|"assistant"
    const trimmedHistory = chatHistory
      .slice(-MAX_HISTORY_MESSAGES)
      .map((msg: any) => {
        const text = msg?.parts?.[0]?.text ?? "";
        const role = (msg?.role === "model" ? "assistant" : "user") as "assistant" | "user";
        return { role, content: String(text).slice(0, MAX_HISTORY_MSG_CHARS) };
      });

    const systemInstruction =
      `You are "Warrior Bot," a friendly AI assistant for the Winona State University (WSU) Major Explorer. ` +
      `Your goal is to help students explore majors. Be encouraging, supportive, and always recommend that the user speak ` +
      `with an official WSU academic advisor for personalized guidance before ending the conversation. ` +
      `Use plain text only; do not use Markdown.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemInstruction },
        ...trimmedHistory,
        { role: "user", content: userQuery },
      ],
      max_tokens: MAX_OUTPUT_TOKENS > 0 ? MAX_OUTPUT_TOKENS : undefined,
    });

    const responseText =
      completion.choices[0]?.message?.content ??
      "I'm sorry, I'm having trouble responding right now. Please try again in a moment.";

    return res.status(200).json({ text: responseText });
  } catch (error) {
    console.error("Error in /api/chat:", error);
    return res.status(500).json({ error: "An internal server error occurred." });
  }
}
