import { redirect } from "next/navigation";

/** Oude URL; planning staat nu onder Site instellingen. */
export default function HomeHeroPlanningRedirectPage() {
  redirect("/settings/home-hero-planning");
}
