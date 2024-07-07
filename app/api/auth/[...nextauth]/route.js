import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDB } from "@utils/database";
import User from "@models/user";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session }) {
      const sessionUser = await User.findOne({
        email: session.user.email,
      });

      session.user.id = sessionUser._id.toString();

      return session;
    },
    async signIn({ profile }) {
      try {
        await connectToDB();

        // check if a user already exists
        const userExists = await User.findOne({
          email: profile.email,
        });

        // if not, create a new user
        if (!userExists) {
          // check if username already exists
          const duplicateUser = await User.findOne({
            userName: profile.name.replace(/\s+/g, "").toLowerCase(),
          });
          // if new user with existing username
          if (duplicateUser) {
            const baseUserName = profile.name.replace(/\s+/g, "").toLowerCase();
            const randomString = Math.floor(10000 + Math.random() * 90000);
            console.log(`${baseUserName}${randomString}`);
            return await User.create({
              email: profile.email,
              userName: `${baseUserName}${randomString}`,
              image: profile.picture,
            });
          }
          return await User.create({
            email: profile.email,
            userName: profile.name.replace(/\s+/g, "").toLowerCase(),
            image: profile.picture,
          });
        }

        return true;
      } catch (e) {
        console.log(e);
        return false;
      }
    },
  },
});

export { handler as GET, handler as POST };
