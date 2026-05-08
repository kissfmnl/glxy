import { redirect } from "next/navigation";

/** Website teksten staan onder Instellingen (alleen admins). */
export default function AdminTekstenRedirectPage() {
  redirect("/settings/website-teksten");
}
