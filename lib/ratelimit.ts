import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

export const createSecretLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
  prefix: "ratelimit:create",
});

export const burnSecretLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(25, "60 s"),
  analytics: true,
  prefix: "ratelimit:burn",
});
