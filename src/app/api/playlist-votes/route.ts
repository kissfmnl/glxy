import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAlbumCover } from "@/app/actions/albumActions";

const MAP_KEY = "PLAYLIST_VOTES_MAP";
const LOG_KEY = "PLAYLIST_VOTES_LOG";
const USER_MAP_KEY = "PLAYLIST_VOTES_USER_MAP";

type VoteEntry = { score: number; up: number; down: number; title: string; artist: string; cover?: string | null };
type VoteMap = Record<string, VoteEntry>;
type UserVotes = Record<string, Record<string, 1 | -1>>;
type VoteLog = Array<{
  trackId: string;
  title: string;
  artist: string;
  cover?: string | null;
  voteType: "up" | "down" | "clear";
  voterId: string;
  votedAt: string;
}>;

async function readSetting(key: string) {
  const row = await prisma.siteSetting.findUnique({ where: { key }, select: { value: true } });
  return row?.value || "";
}

function randomId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseVoteMap(raw: string): VoteMap {
  const parsed = raw ? JSON.parse(raw) : {};
  const result: VoteMap = {};
  for (const [trackId, value] of Object.entries(parsed || {})) {
    if (typeof value === "number") {
      result[trackId] = { score: value, up: value > 0 ? value : 0, down: 0, title: trackId, artist: "", cover: null };
      continue;
    }
    const v = value as any;
    result[trackId] = {
      score: Number(v?.score || 0),
      up: Number(v?.up || 0),
      down: Number(v?.down || 0),
      title: String(v?.title || trackId),
      artist: String(v?.artist || ""),
      cover: v?.cover ? String(v.cover) : null,
    };
  }
  return result;
}

export async function GET(req: NextRequest) {
  try {
    const voterId = String(req.nextUrl.searchParams.get("voterId") || "");
    const [rawMap, rawUserMap] = await Promise.all([readSetting(MAP_KEY), readSetting(USER_MAP_KEY)]);
    const votes = parseVoteMap(rawMap);
    const users: UserVotes = rawUserMap ? JSON.parse(rawUserMap) : {};
    return NextResponse.json({ votes, userVotes: voterId ? users[voterId] || {} : {} });
  } catch {
    return NextResponse.json({ votes: {}, userVotes: {} });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const trackId = String(body?.trackId || "");
    const title = String(body?.title || "");
    const artist = String(body?.artist || "");
    const voteType = body?.voteType === "down" ? "down" : "up";
    const voterId = String(body?.voterId || randomId());
    if (!trackId || !voterId) return NextResponse.json({ ok: false }, { status: 400 });

    const [rawMap, rawLog, rawUserMap] = await Promise.all([readSetting(MAP_KEY), readSetting(LOG_KEY), readSetting(USER_MAP_KEY)]);
    const votes = parseVoteMap(rawMap);
    const logs: VoteLog = rawLog ? JSON.parse(rawLog) : [];
    const userVotes: UserVotes = rawUserMap ? JSON.parse(rawUserMap) : {};
    const prev = userVotes[voterId]?.[trackId] || 0;
    const next = voteType === "up" ? 1 : -1;

    if (!votes[trackId]) {
      votes[trackId] = { score: 0, up: 0, down: 0, title: title || trackId, artist };
    }
    votes[trackId].title = title || votes[trackId].title || trackId;
    votes[trackId].artist = artist || votes[trackId].artist || "";

    let trackCover: string | null = votes[trackId].cover ?? null;
    if (votes[trackId].artist && votes[trackId].title) {
      try {
        const fetched = await getAlbumCover(votes[trackId].artist, votes[trackId].title);
        if (fetched) trackCover = fetched;
      } catch {
        /* ignore */
      }
    }
    votes[trackId].cover = trackCover;

    if (prev === next) {
      if (prev === 1) votes[trackId].up = Math.max(0, votes[trackId].up - 1);
      if (prev === -1) votes[trackId].down = Math.max(0, votes[trackId].down - 1);
      votes[trackId].score = votes[trackId].up - votes[trackId].down;
      const nextUserVotes = { ...(userVotes[voterId] || {}) };
      delete nextUserVotes[trackId];
      userVotes[voterId] = nextUserVotes;
      logs.unshift({
        trackId,
        title: votes[trackId].title,
        artist: votes[trackId].artist,
        cover: votes[trackId].cover,
        voteType: "clear",
        voterId,
        votedAt: new Date().toISOString(),
      });
    } else {
      if (prev === 1) votes[trackId].up = Math.max(0, votes[trackId].up - 1);
      if (prev === -1) votes[trackId].down = Math.max(0, votes[trackId].down - 1);
      if (next === 1) votes[trackId].up += 1;
      if (next === -1) votes[trackId].down += 1;
      votes[trackId].score = votes[trackId].up - votes[trackId].down;
      userVotes[voterId] = { ...(userVotes[voterId] || {}), [trackId]: next as 1 | -1 };
      logs.unshift({
        trackId,
        title: votes[trackId].title,
        artist: votes[trackId].artist,
        cover: votes[trackId].cover,
        voteType,
        voterId,
        votedAt: new Date().toISOString(),
      });
    }
    if (logs.length > 1000) logs.length = 1000;

    await Promise.all([
      prisma.siteSetting.upsert({
        where: { key: MAP_KEY },
        update: { value: JSON.stringify(votes) },
        create: { key: MAP_KEY, value: JSON.stringify(votes) },
      }),
      prisma.siteSetting.upsert({
        where: { key: LOG_KEY },
        update: { value: JSON.stringify(logs) },
        create: { key: LOG_KEY, value: JSON.stringify(logs) },
      }),
      prisma.siteSetting.upsert({
        where: { key: USER_MAP_KEY },
        update: { value: JSON.stringify(userVotes) },
        create: { key: USER_MAP_KEY, value: JSON.stringify(userVotes) },
      }),
    ]);

    return NextResponse.json({ ok: true, votes, userVotes: userVotes[voterId] || {}, voterId });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
