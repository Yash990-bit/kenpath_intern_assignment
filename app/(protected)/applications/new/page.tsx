import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NewApplicationClient from "./NewApplicationClient";

export const instant = false;

export default async function NewApplicationPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <NewApplicationClient />;
}
