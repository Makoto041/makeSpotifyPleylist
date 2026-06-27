import { Hono } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { randomBytes } from "crypto";
import { createSpotifyApi, SPOTIFY_CLIENT_ID, SPOTIFY_REDIRECT_URI } from "./init";

const auth = new Hono();
const scope = "playlist-modify-public playlist-modify-private";
// 本番(HTTPS)でのみ secure Cookie を有効化。ローカルのhttpでもログインできるように。
const isProd = process.env.NODE_ENV === "production";

auth.get("/login", (c) => {
  // 予測不能な乱数で state を生成し、HttpOnly Cookie に保存しておく
  const state = randomBytes(16).toString("hex");
  setCookie(c, "oauth_state", state, {
    maxAge: 600, // 10分でログインを完了させる想定
    path: "/api/auth", // login(set)とcallback(read/delete)でしか使わない
    httpOnly: true,
    secure: isProd,
    sameSite: "Lax",
  });
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
  const returnedState = c.req.query("state");
  const storedState = getCookie(c, "oauth_state");
  // 一度使った state は成否に関わらず破棄(リプレイ攻撃を防ぐ)
  // set時と同じ path にしないと削除が効かない点に注意
  deleteCookie(c, "oauth_state", { path: "/api/auth" });

  if (!code) {
    return c.json({ error: "Code not provided" }, 400);
  }

  // TODO(human): CSRF対策の state 検証
  // returnedState と storedState を照合し、
  // 欠落 or 不一致なら 403 { error: "Invalid state" } を返して中断する。
  if (!returnedState || !storedState || returnedState !== storedState) {
    return c.json({ error: "Invalid state"}, 403);
  }

  try {
    // このリクエスト専用のインスタンスでトークン交換する(共有しない)
    const spotifyApi = createSpotifyApi();
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, expires_in } = data.body;
    setCookie(c, "access_token", access_token, {
      maxAge: expires_in,
      path: "/api", // このトークンを使うのは /api 配下のルートだけ
      httpOnly: true, // JS(document.cookie)から読めなくする = XSS対策
      secure: isProd, // HTTPSでのみ送信する = 盗聴対策
      sameSite: "Lax",
    });
    return c.redirect("/?login=success");
  } catch (error) {
    console.error("Auth callback error:", error);
    return c.json({ error: "Failed to obtain tokens" }, 500);
  }
});

export default auth;
