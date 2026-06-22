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

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get(
  "/google",
  passport.authenticate("google", { session: false, scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
  }),
  (req, res) => {
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
      sameSite: "lax",
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
