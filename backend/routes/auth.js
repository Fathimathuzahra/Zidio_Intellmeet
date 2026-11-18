const express = require("express");
const passport = require("passport");
const {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { signAccessToken, signRefreshToken } = require("../utils/tokens");

const router = express.Router();
const isGoogleOAuthConfigured = () => Boolean(
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CALLBACK_URL
);

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/google", (req, res, next) => {
  if (!isGoogleOAuthConfigured()) {
    return res.status(503).json({
      message: "Google login is not configured on this server. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL to enable it.",
    });
  }

  return passport.authenticate("google", {
    session: false,
    scope: ["profile", "email"],
  })(req, res, next);
});

router.get("/google/callback", (req, res, next) => {
  if (!isGoogleOAuthConfigured()) {
    return res.status(503).json({
      message: "Google login is not configured on this server. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL to enable it.",
    });
  }

  return passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=google_auth_failed`,
  })(req, res, next);
}, (req, res) => {
    const user = req.user;
    const accessToken = signAccessToken({
      id: user._id.toString(),
      role: user.role,
    });
    const refreshToken = signRefreshToken(
      user._id.toString(),
      user.tokenVersion
    );

    const days = Number.parseInt(process.env.REFRESH_COOKIE_DAYS || "7", 10);
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: days * 24 * 60 * 60 * 1000,
    });
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    
    return res.redirect(`${frontendUrl}/auth-success?token=${accessToken}`);
  }
);

router.get("/google/failure", (req, res) => {
  res.status(401).json({ message: "Google authentication failed" });
});

module.exports = router;
