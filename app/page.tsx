import { redirect } from "next/navigation";

// Root "/" → redirect to dashboard (if logged in middleware will pass,
// if not logged in middleware will send to /login)
export default function HomePage() {
  redirect("/dashboard");
}
