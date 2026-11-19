const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const sendEmail = require("../utils/sendEmail");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/tokens");

const cookieOpts = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: Number.parseInt(process.env.REFRESH_COOKIE_DAYS || "7", 10) * 24 * 60 * 60 * 1000,
});
const buildUserPayload = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name || "",
  role: user.role,
  avatarUrl: user.avatarUrl || "",
  bio: user.bio || "",
});
const normalizeEmail = (email) => email.toLowerCase().trim();
const hashPassword = async (password) => bcrypt.hash(password, await bcrypt.genSalt(10));

const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
    const normalizedEmail = normalizeEmail(email);
    if (await prisma.user.findUnique({ where: { email: normalizedEmail } })) {
      return res.status(409).json({ message: "Email already in use" });
    }
    const user = await prisma.user.create({ data: {
      email: normalizedEmail, password: await hashPassword(password), name: name || "", role: "member",
    } });
    const accessToken = signAccessToken({ id: user.id, role: user.role });
    const refreshToken = signRefreshToken(user.id, user.tokenVersion);
    res.cookie("refreshToken", refreshToken, cookieOpts());
    return res.status(201).json({ accessToken, user: buildUserPayload(user) });
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ message: "Email already in use" });
    return next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
    const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const accessToken = signAccessToken({ id: user.id, role: user.role });
    const refreshToken = signRefreshToken(user.id, user.tokenVersion);
    res.cookie("refreshToken", refreshToken, cookieOpts());
    return res.json({ accessToken, user: buildUserPayload(user) });
  } catch (err) { return next(err); }
};

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: "Refresh token missing" });
    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.tokenVersion !== payload.tokenVersion) return res.status(401).json({ message: "Invalid refresh token" });
    const accessToken = signAccessToken({ id: user.id, role: user.role });
    const refreshToken = signRefreshToken(user.id, user.tokenVersion);
    res.cookie("refreshToken", refreshToken, cookieOpts());
    return res.json({ accessToken, user: buildUserPayload(user) });
  } catch (err) { return next(err); }
};

const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      try {
        const payload = verifyRefreshToken(token);
        await prisma.user.updateMany({ where: { id: payload.sub }, data: { tokenVersion: { increment: 1 } } });
      } catch (_) { /* expired token; still clear cookie */ }
    }
    res.clearCookie("refreshToken", cookieOpts());
    return res.json({ message: "Logged out" });
  } catch (err) { return next(err); }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: "Email is required" });
    const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
    const responsePayload = { message: "If that email exists, a reset link was sent" };
    if (!user) return res.json(responsePayload);
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.user.update({ where: { id: user.id }, data: {
      resetPasswordToken: token, resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
    } });
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
    if (process.env.NODE_ENV !== "production") responsePayload.debugResetUrl = resetUrl;
    const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
    if (!smtpConfigured) return res.json(responsePayload);
    try {
      await sendEmail({ email: user.email, subject: "IntellMeet - Reset your password", html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px">
          <h2 style="color:#4f46e5;margin-bottom:8px">Reset your password</h2>
          <p style="color:#374151">Click below to set a new password. This link expires in <strong>15 minutes</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Reset Password</a>
          <p style="margin-top:24px;color:#9ca3af;font-size:12px">If you didn't request this, ignore this email.</p>
        </div>`,
      });
    } catch (mailErr) { console.error("Email send failed:", mailErr.message); }
    return res.json(responsePayload);
  } catch (err) { return next(err); }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, email, password } = req.body || {};
    if (!token || !email || !password) return res.status(400).json({ message: "Token, email and password are required" });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
    const user = await prisma.user.findFirst({ where: {
      email: normalizeEmail(email), resetPasswordToken: token, resetPasswordExpires: { gt: new Date() },
    } });
    if (!user) return res.status(400).json({ message: "Invalid or expired reset link" });
    await prisma.user.update({ where: { id: user.id }, data: {
      password: await hashPassword(password), resetPasswordToken: null, resetPasswordExpires: null,
      tokenVersion: { increment: 1 },
    } });
    return res.json({ message: "Password reset successfully" });
  } catch (err) { return next(err); }
};

module.exports = { register, login, refresh, logout, forgotPassword, resetPassword };
