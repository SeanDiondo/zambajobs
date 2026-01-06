import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express } from "express";
import { storage } from "./storage";

export async function setupGoogleAuth(app: Express) {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  // Use custom domain if available, otherwise fall back to Replit domain
  const APP_URL = process.env.APP_URL || 
    (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000");

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn("⚠️  Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required");
    return;
  }

  console.log("✅ Google OAuth configured");
  console.log(`   Callback URL: ${APP_URL}/api/auth/google/callback`);

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${APP_URL}/api/auth/google/callback`,
        scope: ["profile", "email"],
        passReqToCallback: false,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found in Google profile"));
          }

          // Check if user already exists by email
          const existingUser = await storage.getUserByEmail(email);
          
          if (existingUser) {
            // User exists - allow login
            return done(null, existingUser);
          } else {
            // New user - redirect to signup
            // Pass error with special code to indicate signup needed
            const signupError: any = new Error("SIGNUP_REQUIRED");
            signupError.email = email;
            signupError.firstName = profile.name?.givenName || profile.displayName || "";
            signupError.lastName = profile.name?.familyName || "";
            signupError.profileImageUrl = profile.photos?.[0]?.value;
            return done(signupError, false);
          }
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  // Google OAuth routes
  app.get(
    "/api/auth/google",
    (req, res, next) => {
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      
      console.log("🔐 Google OAuth initiated");
      console.log(`   Host header: ${host}`);
      console.log(`   Using callback URL: ${APP_URL}/api/auth/google/callback`);
      next();
    },
    passport.authenticate("google", { 
      scope: ["profile", "email"],
      prompt: "select_account" // Force account selection
    })
  );

  app.get(
    "/api/auth/google/callback",
    (req, res, next) => {
      passport.authenticate("google", (err: any, user: any) => {
        if (err) {
          // Check if it's a signup required error
          if (err.message === "SIGNUP_REQUIRED") {
            // Redirect to signup page with query params
            const params = new URLSearchParams({
              email: err.email || "",
              firstName: err.firstName || "",
              lastName: err.lastName || "",
              fromGoogle: "true"
            });
            return res.redirect(`/register?${params.toString()}`);
          }
          // Other errors redirect to login
          return res.redirect("/login?error=auth_failed");
        }
        
        if (!user) {
          return res.redirect("/login");
        }
        
        // Log the user in
        req.logIn(user, (loginErr) => {
          if (loginErr) {
            return res.redirect("/login");
          }
          
          // Check if user needs to complete onboarding (no role set)
          if (!user.role) {
            return res.redirect("/onboarding");
          }
          
          // Redirect based on role
          if (user.role === "employer") {
            return res.redirect("/employer/dashboard");
          } else if (user.role === "admin") {
            return res.redirect("/admin/dashboard");
          } else {
            return res.redirect("/dashboard");
          }
        });
      })(req, res, next);
    }
  );
}
