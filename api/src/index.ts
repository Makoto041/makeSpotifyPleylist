import { Hono } from "hono";
import SpotifyWebApi from "spotify-web-api-node";
import dotenv from "dotenv";

// .env ファイルから環境変数を読み込む
dotenv.config();

const app = new Hono();

// 環境変数から設定を取得
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_API_URL =
  process.env.GEMINI_API_URL ||
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || "";
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "";
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || "";
const SPOTIFY_ACCESS_TOKEN = process.env.SPOTIFY_ACCESS_TOKEN || "";

// Spotify Web APIのクライアントを初期化
const spotifyApi = new SpotifyWebApi({
  clientId: SPOTIFY_CLIENT_ID,
  clientSecret: SPOTIFY_CLIENT_SECRET,
  redirectUri: SPOTIFY_REDIRECT_URI,
});

// アクセストークンが存在する場合、Spotify APIクライアントに設定
if (SPOTIFY_ACCESS_TOKEN) {
  spotifyApi.setAccessToken(SPOTIFY_ACCESS_TOKEN);
}

// "/upload" エンドポイントへのPOSTリクエストを処理
app.post("/upload", async (c) => {
  // リクエストボディを解析してフォームデータを取得
  const form = await c.req.parseBody();
  // プレイリスト名を取得。指定がない場合は現在の日付を使用
  const playlistName: string =
    form.fields.playlistName ||
    `${new Date().toISOString().slice(0, 10)} Setlist`;
  // 入力タイプを取得。指定がない場合は"text"とする
  const inputType: string = form.fields.inputType || "text";
  let rawText = "";

  // 入力タイプが"text"の場合、テキストデータを取得
  if (inputType === "text") {
    rawText = form.fields.setlistText || "";
  }
  // 入力タイプが"image"の場合、画像データを処理
  else if (inputType === "image") {
    const imageFile = form.files?.image;
    if (imageFile && imageFile.content) {
      // 画像ファイルをArrayBufferとして読み込み、Uint8Arrayに変換
      const arrayBuffer = await imageFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      // Gemini APIに画像データを送信してテキストを抽出
      const resp = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/octet-stream",
        },
        body: uint8Array,
      });
      if (resp.ok) {
        const data = (await resp.json()) as any;
        rawText = data.extracted_text || "";
      } else {
        return c.json({ message: "Gemini APIエラー" }, 500);
      }
    } else {
      return c.json({ message: "画像が提供されていません" }, 400);
    }
  } else {
    return c.json({ message: "inputTypeが不正です" }, 400);
  }

  // テキストデータをパースして整形
  const formattedSetlist = parseSetlistText(rawText);

  try {
    // Spotify APIを使用してユーザー情報を取得
    const me = await spotifyApi.getMe();
    const userId = me.body.id;

    // プレイリストを作成
    const options: any = {
      public: true,
      description: "自動生成セットリスト",
    };
    const playlistResponse = await(spotifyApi.createPlaylist as any)(
      userId,
      playlistName,
      options
    );
    const playlistId = playlistResponse.body.id;


    const trackIds: string[] = [];
    const lines = formattedSetlist.split("\n");
    for (const line of lines) {
      const parts = line.split(". ");
      if (parts.length > 1) {
        const rest = parts[1];
        const [artist, track] = rest.split(" - ");
        if (artist && track) {
          // アーティスト名と曲名でSpotify内を検索
          const query = `track:${track} artist:${artist}`;
          const searchResponse = await spotifyApi.searchTracks(query, {
            limit: 1,
          });
          if (searchResponse.body.tracks?.items.length) {
            // トラックIDをリストに追加
            trackIds.push(searchResponse.body.tracks.items[0].id);
          }
        }
      }
    }

    if (trackIds.length > 0) {
      // プレイリストにトラックを追加
      await spotifyApi.addTracksToPlaylist(playlistId, trackIds);
    }

    return c.json({ message: `プレイリスト作成成功！ID: ${playlistId}` });
  } catch (error) {
    console.error(error);
    return c.json({ message: "Spotify API処理エラー" }, 500);
  }
});

// テキストデータをパースして整形する関数
function parseSetlistText(rawText: string): string {
  const lines = rawText.split("\n");
  const formatted: string[] = [];
  let index = 1;
  for (const line of lines) {
    // 各行が「アーティスト - 楽曲」の形式であることを確認
    if (line.includes(" - ")) {
      // 行を整形してリストに追加
      formatted.push(`${index}. ${line.trim()}`);
      index++;
    }
  }
  // 整形されたテキストを結合して返す
  return formatted.join("\n");
}

// Vercel環境でのエクスポート
export default app.fetch;
