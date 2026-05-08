"use server";

export async function getTraffic() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch("https://api.anwb.nl/routing/v1/incidents/incidents-summary", {
      next: { revalidate: 60 },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`ANWB endpoint onbereikbaar (${response.status})`);

    const data = await response.json();
    const totals = data?.totals;
    if (!totals?.all) throw new Error("ANWB response mist totals");

    const groups = [
      { key: "a", road: "A-wegen" },
      { key: "n", road: "N-wegen" },
      { key: "other", road: "Overig" },
    ] as const;

    const jams = groups
      .map(({ key, road }) => {
        const row = totals[key] || {};
        const count = Number(row.count || 0);
        const distance = Number(row.distance || 0);
        const delay = Number(row.delay || 0);
        return {
          id: `summary-${key}`,
          road,
          from: `${count} file${count === 1 ? "" : "s"}`,
          to: "",
          length: `${distance.toFixed(1)} km`,
          reason: "Totaal vertraging (geen oorzaak per traject in deze feed)",
          delay: `+${delay} min`,
          rawDelay: delay,
          rawKm: distance,
        };
      })
      .filter((row) => row.rawDelay > 0 || row.from !== "0 files")
      .sort((a, b) => b.rawDelay - a.rawDelay);

    return {
      success: true,
      jams,
      totalJams: Number(totals.all.count || 0),
      totalLength: `${Number(totals.all.distance || 0).toFixed(1)} km`,
      isLive: true,
      source: "ANWB incidents-summary",
      warnings: Array.isArray(data?.warnings) ? data.warnings : [],
      feedNote:
        "De openbare ANWB-samenvatting bevat alleen totalen per wegcategorie, geen lijst met afzonderlijke files of oorzaken.",
    };
  } catch (error) {
    console.error("Traffic Feed Error:", error);

    const mockJams = [
      { id: 'm1', road: 'A4', from: 'Schiphol', to: 'Amsterdam', length: '8.4 km', reason: 'Druk', delay: '+12 min' },
      { id: 'm2', road: 'A12', from: 'Utrecht-Zuid', to: 'Nieuwegein', length: '5.1 km', reason: 'Ongeluk', delay: '+18 min' },
    ];

    return { 
      success: true, 
      jams: mockJams, 
      totalJams: 2, 
      totalLength: "13.5 km",
      isLive: false,
      error: "ANWB feed tijdelijk offline - demo data actief"
    };
  }
}
