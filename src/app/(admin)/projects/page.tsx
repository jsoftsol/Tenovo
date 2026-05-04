import { Metadata } from "next";
import Projects from "./Projects"

export const metadata: Metadata = {
  title: "Projects | Tenovo",
  description: "Manage and organize your projects, collaborate with your team, and track progress in one place.",
};

export default function ProjectsPage() {
  return <Projects />
}