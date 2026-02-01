import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) return xff.split(",")[0].trim();
  return (req.ip || req.socket?.remoteAddress || "unknown").toString();
}

function todayKey() {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function enforceAiLimits(req, res) {
  const ip = getClientIp(req);
  const day = todayKey();

  // ---- Tunables ----
  const DAILY_LIMIT = 10;        // 10 requests/day per IP
  const BURST_LIMIT = 20;        // 20 requests per window
  const BURST_WINDOW_SEC = 600;  // 10 minutes
  const MAX_CHARS = 6000;        // prompt cap (credits protection)
  // -------------------

  const msg = req.body?.message ?? req.body?.text ?? req.body?.userQuery ?? "";
  if (typeof msg === "string" && msg.length > MAX_CHARS) {
    res.status(413).json({ error: "Prompt too long", maxChars: MAX_CHARS });
    return false;
  }

  try {
    const dailyKey = `ai:quota:${ip}:${day}`;
    const burstKey = `ai:burst:${ip}`;

    const dailyCount = await redis.incr(dailyKey);
    if (dailyCount === 1) await redis.expire(dailyKey, 36 * 60 * 60);

    if (dailyCount > DAILY_LIMIT) {
      res.status(429).json({
        error: "Daily AI quota exceeded",
        limit: DAILY_LIMIT,
        used: dailyCount,
      });
      return false;
    }

    const burstCount = await redis.incr(burstKey);
    if (burstCount === 1) await redis.expire(burstKey, BURST_WINDOW_SEC);

    if (burstCount > BURST_LIMIT) {
      res.status(429).json({
        error: "Too many requests",
        windowSeconds: BURST_WINDOW_SEC,
        limit: BURST_LIMIT,
        used: burstCount,
      });
      return false;
    }

    return true;
  } catch (err) {
    console.error("[rateLimit] error:", err?.message || err);
    // Fail CLOSED to protect credits (no AI call)
    res.status(503).json({ error: "Rate limiter unavailable. Try again later." });
    return false;
  }
}
