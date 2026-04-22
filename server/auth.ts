import { storage } from "./storage";
import { supabaseAdmin } from "./supabase";
import type { Express } from "express";

export function setupAuth(app: Express) {
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, displayName, inviteCode } = req.body;
      if (!email || !password || !displayName) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (!inviteCode) {
        return res.status(400).json({ message: "Invite code is required" });
      }

      const invite = await storage.getInviteCode(inviteCode.trim().toUpperCase());
      if (!invite || invite.used) {
        return res.status(400).json({ message: "Invalid or already used invite code" });
      }

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      const user = await storage.createUser({
        id: data.user.id,
        email,
        displayName,
      });

      await storage.redeemInviteCode(invite.code, user.id);

      return res.json(user);
    } catch (err) {
      console.error("Registration error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const token = authHeader.slice(7);
      const { data, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !data.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(data.user.id);
      if (!user) {
        return res.status(401).json({ message: "User profile not found" });
      }

      return res.json(user);
    } catch (err) {
      console.error("Auth me error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
}
