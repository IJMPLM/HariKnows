import { redirect } from "next/navigation";

export default function QuestionsPage() {
  redirect("/faq?tab=questions");
}
