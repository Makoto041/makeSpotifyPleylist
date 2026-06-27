// src/init.ts
import dotenv from "dotenv";
import SpotifyWebApi from "spotify-web-api-node";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

export const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || "";
export const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "";
export const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || "";
export const SPOTIFY_ACCESS_TOKEN = process.env.SPOTIFY_ACCESS_TOKEN || "";
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// リクエストごとに新品の SpotifyWebApi を作る工場。
// 共有インスタンスを使い回すと、別ユーザーのトークンが混ざる危険があるため。
export function createSpotifyApi() {
  return new SpotifyWebApi({
    clientId: SPOTIFY_CLIENT_ID,
    clientSecret: SPOTIFY_CLIENT_SECRET,
    redirectUri: SPOTIFY_REDIRECT_URI,
  });
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});
