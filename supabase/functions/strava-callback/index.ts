import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const appUrl = Deno.env.get("APP_URL") ?? "http://localhost:5173";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const clientId = Deno.env.get("STRAVA_CLIENT_ID")!;
  const clientSecret = Deno.env.get("STRAVA_CLIENT_SECRET")!;

  // Strava denied access
  if (error || !code || !state) {
    return Response.redirect(`${appUrl}/#/settings?stravaError=access_denied`, 302);
  }

  try {
    // Decode user ID from state
    const userId = atob(state);

    // Exchange code for tokens
    const tokenRes = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error("Token exchange failed:", await tokenRes.text());
      return Response.redirect(`${appUrl}/#/settings?stravaError=token_exchange`, 302);
    }

    const tokenData = await tokenRes.json();
    const { access_token, refresh_token, expires_at, athlete } = tokenData;

    // Store tokens in profiles using service role (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        strava_athlete_id: athlete.id,
        strava_tokens: {
          access_token,
          refresh_token,
          expires_at,
          athlete: {
            id: athlete.id,
            firstname: athlete.firstname,
            lastname: athlete.lastname,
          },
        },
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Profile update failed:", updateError);
      return Response.redirect(`${appUrl}/#/settings?stravaError=save_failed`, 302);
    }

    return Response.redirect(`${appUrl}/#/settings?stravaConnected=true`, 302);
  } catch (err) {
    console.error("Callback error:", err);
    return Response.redirect(`${appUrl}/#/settings?stravaError=unknown`, 302);
  }
});
