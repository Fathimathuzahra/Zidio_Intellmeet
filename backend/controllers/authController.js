const crypto = require("crypto");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/tokens");

const cookieOpts = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: Number.parseInt(process.env.REFRESH_COOKIE_DAYS || "7", 10) * 24 * 60 * 60 * 1000,
});

const buildUserPayload = (user) => ({
  id: user._id.toString(),
  email: user.email,
  name: user.name || "",
  role: user.role,
  avatarUrl: user.avatarUrl || "",
  bio: user.bio || "",
});

const register = async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password,
      name: name || "",
      role: role === "admin" ? "admin" : "member",
    });

    const accessToken = signAccessToken({ id: user._id.toString(), role: user.role });
    const refreshToken = signRefreshToken(user._id.toString(), user.tokenVersion);

    res.cookie("refreshToken", refreshToken, cookieOpts());
    return res.status(201).json({ accessToken, user: buildUserPayload(user) });
  } catch (err) {
    return next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = signAccessToken({ id: user._id.toString(), role: user.role });
    const refreshToken = signRefreshToken(user._id.toString(), user.tokenVersion);

    res.cookie("refreshToken", refreshToken, cookieOpts());
    return res.json({ accessToken, user: buildUserPayload(user) });
  } catch (err) {
    return next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: "Refresh token missing" });

    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.sub);

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const accessToken = signAccessToken({ id: user._id.toString(), role: user.role });
    const refreshToken = signRefreshToken(user._id.toString(), user.tokenVersion);

    res.cookie("refreshToken", refreshToken, cookieOpts());
    return res.json({ accessToken, user: buildUserPayload(user) });
  } catch (err) {
    return next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      try {
        const payload = verifyRefreshToken(token);
        await User.findByIdAndUpdate(payload.sub, { $inc: { tokenVersion: 1 } });
      } catch (_) { /* expired token — still clear cookie */ }
    }
    res.clearCookie("refreshToken", cookieOpts());
    return res.json({ message: "Logged out" });
  } catch (err) {
    return next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Don't leak whether email exists
      return res.json({ message: "If that email exists, a reset link was sent" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "IntellMeet – Reset your password",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px">
            <h2 style="color:#4f46e5;margin-bottom:8px">Reset your password</h2>
            <p style="color:#374151">Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.</p>
            <a href="${resetUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
              Reset Password
            </a>
            <p style="margin-top:24px;color:#9ca3af;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error("Email send failed:", mailErr.message);
      // Still return success — don't reveal SMTP issues to client
    }

    return res.json({ message: "If that email exists, a reset link was sent" });
  } catch (err) {
    return next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, email, password } = req.body || {};

    if (!token || !email || !password) {
      return res.status(400).json({ message: "Token, email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.tokenVersion += 1; // invalidate all existing sessions
    await user.save();

    return res.json({ message: "Password reset successfully" });
  } catch (err) {
    return next(err);
  }
};

module.exports = { register, login, refresh, logout, forgotPassword, resetPassword };
