import React, { useState, useEffect } from "react";
import axios from "axios";

interface ApiResponse {
  message: string;
  playlistId?: string;
  tracksAdded?: number;
  tracksTotal?: number;
  needsLogin?: boolean;
}

const App: React.FC = () => {
  const [playlistName, setPlaylistName] = useState<string>("");
  const [inputType, setInputType] = useState<"text" | "image">("text");
  const [setlistText, setSetlistText] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [resultMsg, setResultMsg] = useState<string>("");
  const [loginSuccess, setLoginSuccess] = useState<boolean>(false);
  const [needsLogin, setNeedsLogin] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "success") {
      setLoginSuccess(true);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNeedsLogin(false);

    const name =
      playlistName || `${new Date().toISOString().slice(0, 10)} Setlist`;
    const formData = new FormData();
    formData.append("playlistName", name);
    formData.append("inputType", inputType);
    if (inputType === "text") {
      formData.append("setlistText", setlistText);
    } else if (inputType === "image" && imageFile) {
      formData.append("image", imageFile);
    }

    try {
      const response = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const resData = response.data as ApiResponse;
      if (resData.playlistId) {
        setResultMsg(
          `プレイリスト作成成功！（${resData.tracksAdded}/${resData.tracksTotal}曲追加） ID: ${resData.playlistId}`
        );
      } else {
        setResultMsg(resData.message);
      }
    } catch (error: any) {
      console.error("送信エラー:", error);
      const resData = error.response?.data as ApiResponse | undefined;
      if (resData?.needsLogin) {
        setNeedsLogin(true);
        setResultMsg("");
      } else {
        setResultMsg(resData?.message || "エラーが発生しました。");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow-xl">
        <h1 className="text-4xl font-bold mb-6 text-green-500">
          Spotify Setlist Generator
        </h1>

        {loginSuccess && (
          <div className="mb-4 p-3 bg-green-700 rounded text-green-100">
            Spotifyログイン成功！セットリストを入力してプレイリストを作成できます。
          </div>
        )}

        {needsLogin && (
          <div className="mb-4 p-3 bg-yellow-700 rounded text-yellow-100">
            先にSpotifyでログインしてください。
            <a href="/api/auth/login" className="ml-2 underline font-semibold">
              ログインする
            </a>
          </div>
        )}

        <div className="mb-6">
          <a
            href="/api/auth/login"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
          >
            Spotifyでログイン
          </a>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-medium mb-2">プレイリスト名</label>
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="（空欄の場合は日付＋Setlist）"
              className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block font-medium mb-2">入力形式</label>
            <select
              value={inputType}
              onChange={(e) => setInputType(e.target.value as "text" | "image")}
              className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="text">テキスト</option>
              <option value="image">画像</option>
            </select>
          </div>
          {inputType === "text" ? (
            <div>
              <label className="block font-medium mb-2">
                セットリスト（テキスト）
              </label>
              <textarea
                value={setlistText}
                onChange={(e) => setSetlistText(e.target.value)}
                placeholder="例:&#10;1: STAY - Smile High, Antwaun Stanley&#10;2: In Touch - Daul, Charli Taft&#10;3: WE ARE - eill&#10;..."
                className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 h-40"
              ></textarea>
            </div>
          ) : (
            <div>
              <label className="block font-medium mb-2">
                セットリスト（画像）
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) {
                    setImageFile(e.target.files[0]);
                  }
                }}
                className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}
          <button
            type="submit"
            className="w-full py-3 bg-green-500 hover:bg-green-600 transition-colors font-semibold rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={loading}
          >
            {loading ? "処理中..." : "プレイリスト作成"}
          </button>
        </form>
        {resultMsg && <p className="mt-6 text-center text-lg">{resultMsg}</p>}
      </div>
    </div>
  );
};

export default App;
