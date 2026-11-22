import { fetchDevpostHackathons } from "@/lib/ingestion/hackathons/devpost";
import {
  fetchTwitterHackathonSignals,
  resolvePublicUrlOrTweet,
} from "@/lib/ingestion/hackathons/twitter-adapter";
import {
  normalizeHackathonCandidate,
  type RawHackathonCandidate,
} from "@/lib/ingestion/hackathons/normalize";
import { getAiPermissions, upsertHackathons } from "@/lib/db/repository";

export async function runHackathonIngestionPipeline(): Promise<{
  fetchedRaw: number;
  normalizedValid: number;
  inserted: number;
  merged: number;
  total: number;
  providerStatus: Record<string, string>;
}> {
  const providerStatus: Record<string, string> = {};

  const [devpostRes, twitterRes] = await Promise.allSettled([
    fetchDevpostHackathons(),
    fetchTwitterHackathonSignals(),
  ]);

  const rawCandidates: RawHackathonCandidate[] = [];

  if (devpostRes.status === "fulfilled") {
    rawCandidates.push(...devpostRes.value);
    providerStatus.devpost = `OK (${devpostRes.value.length} fetched)`;
  } else {
    providerStatus.devpost = "DEGRADED (fallback active)";
  }

  if (twitterRes.status === "fulfilled") {
    rawCandidates.push(...twitterRes.value);
    providerStatus.twitter = `OK (${twitterRes.value.length} signals)`;
  } else {
    providerStatus.twitter = "DEGRADED (fallback active)";
  }

  // Enforce strict batch cap of 30 candidates per cron run (Cost Control Rule 6.4)
  const capped = rawCandidates.slice(0, 30);
  const validNormalized = [];

  for (const raw of capped) {
    const res = await normalizeHackathonCandidate(raw);
    if (res.is_valid_upcoming_hackathon && res.candidate) {
      validNormalized.push(res.candidate);
    }
  }

  const upsertStats = await upsertHackathons(validNormalized);

  return {
    fetchedRaw: capped.length,
    normalizedValid: validNormalized.length,
    ...upsertStats,
    providerStatus,
  };
}

export async function submitAndVerifyHackathonUrl(params: {
  url: string;
  rawContext?: string;
}) {
  const rawCandidate = await resolvePublicUrlOrTweet(params.url, params.rawContext);
  const norm = await normalizeHackathonCandidate(rawCandidate);
  if (!norm.is_valid_upcoming_hackathon || !norm.candidate) {
    return {
      accepted: false,
      reason:
        norm.rejection_reason ||
        "Candidate did not pass the hackathon verification gate.",
    };
  }

  const perms = await getAiPermissions();
  const requiresApproval = perms.community_hackathons_require_approval;
  const shouldPublish = requiresApproval
    ? false
    : norm.candidate.confidence_score >= 0.85;

  const recordToSave = {
    ...norm.candidate,
    created_by: "community" as const,
    approval_status: shouldPublish ? ("APPROVED" as const) : ("PENDING_REVIEW" as const),
    is_published: shouldPublish,
  };

  const stats = await upsertHackathons([recordToSave]);
  return {
    accepted: true,
    candidate: recordToSave,
    stats,
  };
}
