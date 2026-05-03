import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | Tenovo SaaS Platform",
  description:
    "Create your Tenovo account to access a multi-tenant workspace, manage teams, and streamline your workflows.",
};

export default function SignUp() {
  return <SignUpForm />;
}
