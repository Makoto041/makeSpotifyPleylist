#!/bin/bash
set -e

echo "フロントエンドのビルドを開始します..."
cd client
npm run build
cd ..

echo "バックエンドのビルドを開始します..."
cd api
npm run build
cd ..

echo "Vercelに本番デプロイを開始します..."
vercel --prod

echo "デプロイが完了しました。"
