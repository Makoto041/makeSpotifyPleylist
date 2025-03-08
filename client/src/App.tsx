// client/src/App.tsx
import React, { useState } from "react";
import axios from "axios";

const App: React.FC = () => {
  const [playlistName, setPlaylistName] = useState<string>("");
  const [inputType, setInputType] = useState<"text" | "image">("text");
  const [setlistText, setSetlistText] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [resultMsg, setResultMsg] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
      // Vercel の場合、相対パス "/api" でサーバーレス関数にリクエスト可能
      const response = await axios.post("/api", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const resData = response.data as any;
      setResultMsg(resData.message);
    } catch (error) {
      console.error(error);
      setResultMsg("エラーが発生しました。");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow-xl">
        <h1 className="text-4xl font-bold mb-6 text-green-500">
          Spotify Setlist Generator
        </h1>
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
                placeholder="例:&#10;1. アーティストA - 楽曲A&#10;2. アーティストB - 楽曲B"
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
