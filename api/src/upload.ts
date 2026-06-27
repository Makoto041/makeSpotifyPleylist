import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { Buffer } from "buffer";
import mimeTypes from "mime-types";
import { spotifyApi, geminiModel } from "./init";

const upload = new Hono();

upload.post("/", async (c) => {
  const accessToken = getCookie(c, "access_token");
  if (!accessToken) {
    return c.json({ message: "Spotifyにログインしてください", needsLogin: true }, 401);
  }
  spotifyApi.setAccessToken(accessToken);

  try {
    const body = await c.req.parseBody();
    const playlistName =
      (body.playlistName as string) ||
      `${new Date().toISOString().slice(0, 10)} Setlist`;
    const inputType = (body.inputType as string) || "text";

    let rawText = "";
    if (inputType === "text") {
      rawText = (body.setlistText as string) || "";
    } else if (inputType === "image") {
      const imageFile = body.image;
      if (!imageFile || typeof imageFile === "string") {
        return c.json({ message: "画像が提供されていません" }, 400);
      }
      const arrayBuffer = await imageFile.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const mimeType =
        imageFile.type ||
        (mimeTypes.lookup(imageFile.name) as string) ||
        "image/jpeg";

      const result = await geminiModel.generateContent([
        { inlineData: { data: base64, mimeType } },
        {
          text:
            "この画像はセットリストです。各楽曲を「アーティスト名 - 曲名」の形式で抽出し、" +
            "各楽曲を改行で区切って返してください。番号や記号、その他の説明文は含めないでください。",
        },
      ]);
      rawText = result.response.text();
    } else {
      return c.json({ message: "inputTypeが不正です" }, 400);
    }

    const lines = parseSetlistLines(rawText);
    if (lines.length === 0) {
      return c.json({ message: "セットリストが見つかりませんでした" }, 400);
    }

    const me = await spotifyApi.getMe();
    const userId = me.body.id;
    const playlistResponse = await (spotifyApi.createPlaylist as any)(
      userId,
      playlistName,
      { public: true, description: "自動生成セットリスト" }
    );
    const playlistId = playlistResponse.body.id;

    const trackUris: string[] = [];
    for (const { part1, part2 } of lines) {
      const searchResponse = await spotifyApi.searchTracks(
        `${part1} ${part2}`,
        { limit: 1 }
      );
      const found = searchResponse.body.tracks?.items[0];
      if (found) trackUris.push(`spotify:track:${found.id}`);
    }

    if (trackUris.length > 0) {
      await spotifyApi.addTracksToPlaylist(playlistId, trackUris);
    }

    return c.json({
      message: `プレイリスト作成成功！`,
      playlistId,
      tracksAdded: trackUris.length,
      tracksTotal: lines.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ message: "処理中にエラーが発生しました" }, 500);
  }
});

function parseSetlistLines(rawText: string): { part1: string; part2: string }[] {
  const result: { part1: string; part2: string }[] = [];
  for (const line of rawText.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // "1." "1:" "1)" "1 " などの先頭番号を除去
    const cleaned = trimmed.replace(/^\d+[\.\:\)\s]\s*/, "").trim();
    const dashIdx = cleaned.indexOf(" - ");
    if (dashIdx === -1) continue;
    result.push({
      part1: cleaned.substring(0, dashIdx).trim(),
      part2: cleaned.substring(dashIdx + 3).trim(),
    });
  }
  return result;
}

export default upload;
