import { redirect } from "next/navigation";

export default function ResultPage() {
  // Results are housed directly in the Arena or visually represented in History.
  redirect("/arena");
}
