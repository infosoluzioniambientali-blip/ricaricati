import type { Express, Request, Response } from "express";
import { SignJWT } from "jose";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

async function createSessionToken(openId: string, name: string): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  return new SignJWT({ openId, name, appId: "railway" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1y")
    .sign(secret);
}

export function registerGoogleOAuthRoutes(app: Express) {
  app.get("/auth/google", (req: Request, res: Response) => {
const redirectUri = `https://${req.get("host")}/auth/google/callback`;    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });

  app.get("/auth/google/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string;
    if (!code) { res.status(400).send("Missing code"); return; }
    try {
const redirectUri = `https://${req.get("host")}/auth/google/callback`;      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code, client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri, grant_type: "authorization_code" }),
      });
      const tokens = await tokenRes.json() as any;
      if (!tokens.access_token) { res.status(500).send("Failed to get access token"); return; }
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const userInfo = await userRes.json() as any;
      const openId = `google_${userInfo.id}`;
      await db.upsertUser({ openId, name: userInfo.name || userInfo.email, email: userInfo.email, loginMethod: "google", lastSignedIn: new Date() });
      const sessionToken = await createSessionToken(openId, userInfo.name || userInfo.email);
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect("/");
    } catch (error) {
      console.error("[Google OAuth] Error:", error);
      res.status(500).send("Authentication failed");
    }
  });
}
