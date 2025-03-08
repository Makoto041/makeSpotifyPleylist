# Setlist Spotify

Setlist Spotify は、入力されたセットリストから自動的に Spotify プレイリストを生成するサービスです。  
ユーザーは、セットリストを「アーティスト名 - 楽曲名」というテキスト形式で入力するか、セットリストの画像をアップロードできます。  
画像の場合は、Gemini 2.0 API を利用して OCR によりテキストを抽出し、セットリストを解析した上で Spotify 上で該当する楽曲を検索し、プレイリストを作成します。

## 主な機能

- **入力形式の多様性**: テキスト入力または画像アップロードに対応
- **OCR 機能**: Gemini 2.0 API を使用して画像からテキストを抽出
- **Spotify 連携**: Spotify Web API を利用して楽曲を検索し、自動的にプレイリストを作成
- **モダンなフロントエンド**: React、Vite、TypeScript、Tailwind CSS を使用
- **サーバーレスバックエンド**: Hono を利用し、Vercel にデプロイ

## プロジェクト構成

Setlist-Spotify/
├─ api/                 # バックエンド（Hono サーバーレス関数）
│   ├─ src/
│   │   └─ index.ts   # バックエンド API のエントリーポイント
│   ├─ package.json
│   └─ tsconfig.json
├─ client/              # フロントエンド（React/Vite）
│   ├─ public/
│   ├─ src/
│   │   ├─ App.tsx    # メインの React コンポーネント
│   │   └─ main.tsx
│   ├─ package.json
│   └─ tsconfig.json
├─ vercel.json          # Vercel の設定（ビルド & ルーティング）
└─ README.md

## セットアップ

### 前提条件

- [Node.js](https://nodejs.org/)（v14 以上を推奨）
- npm（Node.js に同梱）

### フロントエンドのセットアップ

1. **client ディレクトリに移動**
   ```bash
   cd client

	2.	依存パッケージのインストール

npm install


	3.	開発サーバーの起動

npm run dev


	4.	本番ビルドの作成

npm run build



バックエンドのセットアップ
	1.	api ディレクトリに移動

cd api


	2.	依存パッケージのインストール

npm install


	3.	バックエンドをローカルで動作確認

npm run dev



環境変数の設定

バックエンド（api ディレクトリ）に .env ファイルを作成し、以下の内容を記述します（各値はご自身のものに置き換えてください）。

GEMINI_API_KEY=your_gemini_api_key
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=your_spotify_redirect_uri
SPOTIFY_ACCESS_TOKEN=your_spotify_access_token

また、これらの環境変数は Vercel のプロジェクト設定からも設定してください。

デプロイ

このプロジェクトは、Vercel に静的フロントエンドとサーバーレスバックエンドとしてデプロイされます。

vercel.json の設定例

プロジェクトのルートに vercel.json を配置します。以下は一例です。

{
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    },
    {
      "src": "api/src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/src/index.ts" },
    { "src": "/(.*)", "dest": "/client/$1" }
  ]
}

この設定により、
	•	/api/* のリクエストはバックエンドの api/src/index.ts に転送され、
	•	その他のリクエストはフロントエンドのビルド成果物（client/dist）にルーティングされます。

Vercel CLI を使用したデプロイ
	1.	Vercel CLI のインストール

npm install -g vercel


	2.	Vercel へのログイン

vercel login


	3.	プレビュー環境へのデプロイ
プロジェクトのルートで以下を実行します。

vercel

プレビュー URL が生成されますので、動作確認を行ってください。

	4.	本番環境へのデプロイ
問題がなければ、本番環境にデプロイします。

vercel --prod



使用方法
	•	テキスト入力:
テキストエリアに各行「アーティスト名 - 楽曲名」の形式でセットリストを入力します。プレイリスト名は任意で入力できます（未入力の場合は日付＋Setlist となります）。
	•	画像入力:
画像ファイルをアップロードすると、バックエンドで Gemini 2.0 API を用いて OCR が実行され、テキストが抽出されます。
	•	送信後、Spotify 上で該当する楽曲が検索され、プレイリストが自動生成されます。作成されたプレイリストの ID が返されます。

トラブルシューティング
	•	404 エラー:
/api または /api/upload に対して 404 エラーが返る場合、vercel.json のルーティング設定、バックエンドのエンドポイント、及びデプロイ状況を確認してください。
	•	ビルドエラー:
ローカルで npm run build を実行してエラー内容を確認し、必要に応じて修正してください。Vercel のログも参考にしてください。
	•	環境変数:
必要な環境変数が正しく設定されているか、Vercel の設定と .env ファイルを確認してください。

ライセンス

このプロジェクトは MIT License の下でライセンスされています。

クレジット
	•	Hono - 軽量なサーバーレスフレームワーク
	•	React と Vite - フロントエンドフレームワーク
	•	Tailwind CSS - スタイリング
	•	Spotify Web API - 楽曲検索とプレイリスト作成
	•	Gemini 2.0 API - OCR 機能
