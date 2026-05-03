import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In to Tenovo",
  description: "Sign in to Tenovo to manage your organization, collaborate with your team, and streamline your workflows.",
};

export default function SignIn() {
  return <SignInForm />;
}
