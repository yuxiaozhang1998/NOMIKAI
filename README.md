# ASICS 懇親会クイズ大会 - Netlify版

この版は、元の `localStorage` 同期を Netlify Functions + Netlify Blobs に置き換えた版です。  
スマホとPCなど、別デバイス間でも同じURLで同期できます。

## デプロイ方法

1. このフォルダを GitHub にアップロード
2. Netlify で **Add new site > Import an existing project**
3. Build command: `npm run build`
4. Publish directory: `.`
5. Deploy

## 使い方

- PC/スクリーン：トップURLを開くとホスト画面になります。
- スマホ：ホスト画面のQRコードを読み込むと `?mode=player` で参加者画面になります。
- ゲームを最初からやり直す場合は、ホスト右上のリセットボタンを押してください。

## 注意

- フロント側は Tailwind / Lucide / QRCode.js / Chart.js をCDNから読み込みます。
- 通信は1秒ごとのポーリングです。大人数の場合はFirebase/Supabase等のリアルタイムDBへの変更も可能です。
