
import { enforceAiLimits } from "./utils/rateLimit.ts";
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

    const systemInstruction =
      `You are "Warrior Bot," a friendly AI assistant for the Winona State University (WSU) Major Explorer. ` +
      `Help students explore majors. Always recommend speaking with an official WSU academic advisor for personalized guidance. ` +
      `Use plain text only; do not use Markdown.`;

    const trimmedHistory = chatHistory.slice(-12).map((msg) => {
      const text = msg?.parts?.[0]?.text ?? "";
      const role = msg?.role === "model" ? "assistant" : "user";
      return { role, content: String(text).slice(0, 2000) };
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemInstruction },
        ...trimmedHistory,
        { role: "user", content: userQuery.slice(0, 3000) },
      ],
      max_tokens: 250,
    });

    return res.json({ text: completion.choices[0]?.message?.content ?? "" });
  } catch (err) {
    console.error("OpenAI error:", err);
    return res.status(500).json({ error: "AI error" });
  }
});

// Serve Vite build output
app.use(express.static(path.join(__dirname, "dist")));

// SPA fallback (must be last route)
// Express v5 needs a regex instead of "*"
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
