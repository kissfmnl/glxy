export type PublicNavItem = { href: string; label: string; settingKey: string; defaultVisible: boolean };

export const PUBLIC_NAV_ITEMS: PublicNavItem[] = [
  { href: "/", label: "Home", settingKey: "NAV_SHOW_HOME", defaultVisible: true },
  { href: "/playlist", label: "Playlist", settingKey: "NAV_SHOW_PLAYLIST", defaultVisible: true },
  { href: "/programmering", label: "Programmering", settingKey: "NAV_SHOW_PROGRAMMERING", defaultVisible: true },
  { href: "/djs", label: "DJ’s", settingKey: "NAV_SHOW_DJS", defaultVisible: true },
  { href: "/kiss40", label: "KISS40", settingKey: "NAV_SHOW_KISS40", defaultVisible: true },
  { href: "/frequenties", label: "Frequenties", settingKey: "NAV_SHOW_FREQUENTIES", defaultVisible: true },
  { href: "/join-kiss", label: "Join KISS", settingKey: "NAV_SHOW_JOIN_KISS", defaultVisible: true },
  { href: "/acties", label: "Acties", settingKey: "NAV_SHOW_ACTIES", defaultVisible: false },
];

export function resolvePublicNavItems(map: Map<string, string>) {
  return PUBLIC_NAV_ITEMS.filter((item) => {
    const raw = (map.get(item.settingKey) ?? (item.defaultVisible ? "yes" : "no")).trim().toLowerCase();
    return raw !== "no";
  }).map((item) => ({ href: item.href, label: item.label }));
}
