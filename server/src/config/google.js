const passport = require("passport");
const GoogleStrategy =
  require("passport-google-oauth20").Strategy;

const env = require("./env");
const authRepository = require("../modules/auth/auth.repository");

passport.use(
  new GoogleStrategy(
    {
      clientID: env.google.clientId,
      clientSecret: env.google.clientSecret,
      callbackURL: env.google.callbackUrl
    },

    async (
      accessToken,
      refreshToken,
      profile,
      done
    ) => {
      try {
        const googleId = profile.id;

        const email =
          profile.emails?.[0]?.value
            ?.trim()
            .toLowerCase();

        const name =
          profile.displayName ||
          email?.split("@")[0] ||
          "Google User";

        const avatarUrl =
          profile.photos?.[0]?.value || null;

        if (!email) {
          return done(
            new Error(
              "Google account does not provide an email address."
            )
          );
        }

        let user =
          await authRepository.findUserByOAuth(
            "google",
            googleId
          );

        if (user) {
          await authRepository.updateLastLogin(
            user.id
          );

          return done(null, user);
        }

        user =
          await authRepository.findUserByEmail(
            email
          );

        if (user) {
          await authRepository.createOAuthAccount({
            userId: user.id,
            provider: "google",
            providerAccountId: googleId
          });

          await authRepository.updateGoogleProfile(
            user.id,
            avatarUrl
          );

          await authRepository.updateLastLogin(
            user.id
          );

          user =
            await authRepository.findUserById(
              user.id
            );

          return done(null, user);
        }

        const role =
          await authRepository.findRoleByName(
            "warehouse_staff"
          );

        user =
          await authRepository.createUser({
            name,
            email,
            passwordHash: null,
            roleId: role.id,
            avatarUrl,
            emailVerifiedAt: new Date()
          });

        await authRepository.createOAuthAccount({
          userId: user.id,
          provider: "google",
          providerAccountId: googleId
        });

        user =
          await authRepository.findUserById(
            user.id
          );

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

module.exports = passport;