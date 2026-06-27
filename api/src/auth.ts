import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { spotifyApi, SPOTIFY_CLIENT_ID, SPOTIFY_REDIRECT_URI } from "./init";

const auth = new Hono();
const scope = "playlist-modify-public playlist-modify-private";

auth.get("/login", (c) => {
  const state = Date.now().toString(36);
  const query = new URLSearchParams({
    response_type: "code",
    client_id: SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    state,
  });
  return c.redirect("https://accounts.spotify.com/authorize?" + query);
});

auth.get("/callback", async (c) => {
  const code = c.req.query("code");
  if (!code) {
    return c.json({ error: "Code not provided" }, 400);
  }
  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token, expires_in } = data.body;
    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);
    setCookie(c, "access_token", access_token, {
      maxAge: expires_in,
      path: "/",
      sameSite: "Lax",
    });
    return c.redirect("/?login=success");
  } catch (error) {
    console.error("Auth callback error:", error);
    return c.json({ error: "Failed to obtain tokens" }, 500);
  }
});

export default auth;
