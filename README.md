# makeSpotifyPlaylist

このリポジトリは、ユーザーが画像またはテキスト形式のセットリストを入力し、Spotify プレイリストを自動生成するためのフロントエンドアプリケーションです。  
フロントエンドは **React**、**Vite**、および **Tailwind CSS** を用いて実装されています。  


## 特徴

- **入力形式**:  
  - 画像アップロード（Gemini API を利用したテキスト抽出）
  - テキスト入力（セットリストを直接入力）
- **プレイリスト名**:  
  - ユーザーが任意に入力可能  
  - 未入力の場合は自動的に「YYYY-MM-DD Setlist」として生成
- **出力**:  
  - Spotifyでプレイリストが自動で生成

## Getting Started

### 前提条件

- [Node.js](https://nodejs.org/) (v14以上推奨)
- [npm](https://www.npmjs.com/) 

### プロジェクトのセットアップ

1. **リポジトリをクローン**

   ```bash
   git clone https://github.com/Makoto041/makeSpotifyPleylist.git
   cd makeSpotifyPleylist
