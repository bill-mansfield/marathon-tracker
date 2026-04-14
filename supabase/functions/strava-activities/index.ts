import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: { id: number; firstname: string; lastname: string };
}

interface StravaActivity {
  id: number;
  name: string;
  distance: number; // metres
  start_date_local: string; // ISO string in athlete's local time
  type: string;
}

async function refreshTokenIfNeeded(
  tokens: StravaTokens,
  clientId: string,
  clientSecret: string
): Promise<StravaTokens> {
  const nowSecs = Math.floor(Date.now() / 1000);
  if (tokens.expires_at > nowSecs + 300) return tokens; // still valid for 5+ min

  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) throw new Error("Token refresh failed: " + await res.text());
  const data = await res.json();
  return { ...tokens, access_token: data.access_token, expires_at: data.expires_at };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const clientId = Deno.env.get("STRAVA_CLIENT_ID")!;
    const clientSecret = Deno.env.get("STRAVA_CLIENT_SECRET")!;

    // Authenticate the calling user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Use anon key + user's JWT — correct Supabase edge function auth pattern
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Parse date range params
    const url = new URL(req.url);
    const after = parseInt(url.searchParams.get("after") ?? "0");
    const before = parseInt(url.searchParams.get("before") ?? String(Math.floor(Date.now() / 1000)));

    // Load strava tokens from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("strava_tokens")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.strava_tokens) {
      return new Response(JSON.stringify({ error: "Strava not connected" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    let tokens: StravaTokens = profile.strava_tokens as StravaTokens;

    // Refresh token if expired, and persist updated tokens
    const refreshed = await refreshTokenIfNeeded(tokens, clientId, clientSecret);
    if (refreshed.access_token !== tokens.access_token) {
      tokens = refreshed;
      await supabase
        .from("profiles")
        .update({ strava_tokens: tokens })
        .eq("id", user.id);
    }

    // Fetch activities from Strava (paginate up to 200)
    const activities: StravaActivity[] = [];
    let page = 1;
    while (true) {
      const stravaRes = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?after=${after}&before=${before}&per_page=100&page=${page}`,
        { headers: { Authorization: `Bearer ${tokens.access_token}` } }
      );

      if (!stravaRes.ok) {
        throw new Error("Strava API error: " + await stravaRes.text());
      }

      const page_activities: StravaActivity[] = await stravaRes.json();
      activities.push(...page_activities);

      if (page_activities.length < 100) break; // last page
      page++;
      if (page > 2) break; // cap at 200 activities
    }

    // Filter to run types only
    const RUN_TYPES = ["Run", "TrailRun", "VirtualRun", "Treadmill"];
    const runs = activities
      .filter((a) => RUN_TYPES.includes(a.type))
      .map((a) => ({
        id: a.id,
        name: a.name,
        distanceKm: Math.round((a.distance / 1000) * 10) / 10,
        date: a.start_date_local.split("T")[0], // YYYY-MM-DD in athlete's timezone
        type: a.type,
      }));

    return new Response(JSON.stringify({ runs }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
