import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getFrequentiesBadgePaths } from "@/app/actions/frequentiesBadgeActions";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import { FrequentiesBadgesClient } from "@/components/portal/FrequentiesBadgesClient";
import { listWebsiteImageFiles } from "@/lib/websiteImageFiles";
import { hasPortalPermission } from "@/lib/portalPermissions";

export default async function FrequentiesBadgesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!hasPortalPermission(session, "manageSiteSettings")) redirect("/settings");

  const { ios, android, coverageMap } = await getFrequentiesBadgePaths();
  const imageOptions = await listWebsiteImageFiles();

  return (
    <PortalPageShell width="readable">
      <Link
        href="/settings/site"
        className="mb-6 inline-flex items-center gap-2 text-sm font-black text-brand-primary transition-colors hover:text-brand-primary/80"
      >
        ← Terug naar site instellingen
      </Link>
      <h1 className="mb-2 text-3xl font-black text-gray-900 dark:text-white">Frequenties: kaart & appknoppen</h1>
      <p className="mb-8 text-sm text-gray-600 dark:text-white/65">
        De kop en tekst bij de frequenties staan onder{" "}
        <Link href="/settings/website-teksten" className="font-black text-brand-primary hover:underline">
          Website-teksten
        </Link>{" "}
        (tab Frequenties). De titel boven de frequentielijst kun je daar ook instellen.
      </p>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:p-6">
        <FrequentiesBadgesClient iosPath={ios} androidPath={android} coverageMapPath={coverageMap} imageOptions={imageOptions} />
      </div>
    </PortalPageShell>
  );
}
