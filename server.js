import { systemInstruction } from "./utils/ai_config.js";
import { enforceAiLimits, redis } from "./utils/rateLimit.js";
import cors from "cors";
import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: ".env.local" });

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is missing. Check .env.local (project root) and restart server.");
  process.exit(1);
}

const app = express();

app.use(cors({ origin: true, credentials: false }));
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/chat", async (req, res) => {
  const ok = await enforceAiLimits(req, res);
  if (!ok) return;

  try {
    const { chatHistory, userQuery } = req.body || {};

    if (typeof userQuery !== "string" || !Array.isArray(chatHistory)) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    // --- Backend Cache (Redis) ---
    const cacheKey = `ai:cache:${Buffer.from(userQuery).toString('base64').slice(0, 32)}`;
    try {
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) return res.json({ text: cached });
      }
    } catch (e) { }

    // --- Hybrid Search / Local Context ---
    // Simple top-hit context to avoid AI halluncinations
    const lowerQuery = userQuery.toLowerCase();
    const keywords = ["business", "nursing", "computer", "math", "art", "science", "social work", "accounting"];
    const matched = keywords.filter(k => lowerQuery.includes(k));
    let extraContext = "";
    if (matched.length > 0) {
      extraContext = `\n\nUser is interested in: ${matched.join(", ")}. Ensure you mention relevant WSU programs like ${matched[0]} if appropriate.`;
    }

    // --- History Trimming (Cost Reduction) ---
    const trimmedHistory = chatHistory.slice(-5).map((msg) => {
      const text = msg?.parts?.[0]?.text ?? "";
      const role = msg?.role === "model" ? "assistant" : "user";
      return { role, content: String(text).slice(0, 1000) };
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemInstruction + extraContext +
            "\n\nRules: Concise plain text only. No markdown. Refer to WSU academic advisors."
        },
        ...trimmedHistory,
        { role: "user", content: userQuery.slice(0, 1500) },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content ?? "";

    // Store in cache for 1 hour
    try {
      if (redis) {
        await redis.set(cacheKey, responseText, { ex: 3600 });
      }
    } catch (e) { }

    return res.json({ text: responseText });
  } catch (err) {
    console.error("OpenAI error:", err);
    return res.status(500).json({ error: "AI error" });
  }
});


app.use(express.static(path.join(__dirname, "dist")));



app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
