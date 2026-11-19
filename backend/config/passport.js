const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const prisma = require("./prisma");

const configurePassport = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL;
  if (!clientId || !clientSecret || !callbackUrl) return;
  passport.use(new GoogleStrategy({ clientID: clientId, clientSecret, callbackURL: callbackUrl },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) return done(new Error("Google account email not available"));
        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: { email, name: profile.displayName || "", oauthProvider: "google", oauthId: profile.id },
        });
        if (!user.oauthProvider) await prisma.user.update({ where: { id: user.id }, data: { oauthProvider: "google", oauthId: profile.id } });
        return done(null, user);
      } catch (error) { return done(error); }
    }
  ));
};
module.exports = configurePassport;
