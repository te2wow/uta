# VRM Mirror Studio

WebブラウザでVRMモデルを使った全身トラッキングと録画ができるアプリケーション。MediaPipeで全身・顔・手指をトラッキングし、鏡反転で自然な動きを再現します。

## 主な機能

- **VRMモデル対応**: @pixiv/three-vrmを使用したVRMファイルの読み込みと表示
- **全身トラッキング**: MediaPipe Holisticによる顔・手指・ポーズの検出
- **鏡反転表示**: より自然な操作感のための座標・ボーン・Quaternion反転
- **表情制御**: BlendShapeを使った目・口・眉の動的制御
- **2カメラ構成**: 正面ビュー（録画対象）+ 背面プレビュー
- **高品質録画**: MediaRecorder APIとFFmpeg.wasmによる動画・音声合成
- **ボイスチェンジ**: Voicemod Control API連携（オプション）
- **ノイズ低減**: OneEuroFilterとEMAによるトラッキングデータの安定化
- **レスポンシブUI**: Tailwind CSSによる美しいインターフェース

## 技術スタック

- **フロントエンド**: React + TypeScript + Vite
- **3D描画**: Three.js + @pixiv/three-vrm
- **トラッキング**: MediaPipe Holistic
- **UI**: Tailwind CSS
- **録画・音声処理**: MediaRecorder API + Web Audio API + FFmpeg.wasm
- **ボイスチェンジ**: Voicemod Control API (オプション)

## 必要な環境

- Node.js 18.0.0以上
- モダンブラウザ（Chrome, Firefox, Safari, Edge）
- Webカメラ
- マイク（音声録音する場合）
- Voicemod（ボイスチェンジ機能を使用する場合）

## インストール

1. **リポジトリのクローン**
```bash
git clone https://github.com/your-username/uta.git
cd uta
```

2. **依存関係のインストール**
```bash
npm install
```

3. **必要なパッケージの追加インストール**
```bash
# Three.js関連
npm install three @types/three
npm install @pixiv/three-vrm

# MediaPipe
npm install @mediapipe/holistic @mediapipe/camera_utils @mediapipe/drawing_utils

# FFmpeg
npm install @ffmpeg/ffmpeg @ffmpeg/util

# その他のユーティリティ
npm install class-variance-authority clsx tailwind-merge
```

4. **開発サーバーの起動**
```bash
npm run dev
```

## 設定

### Voicemod Control API（オプション）

ボイスチェンジ機能を使用する場合は、以下の設定が必要です：

1. **Voicemodのインストール**
   - [Voicemod公式サイト](https://www.voicemod.net/)からダウンロード・インストール
   - Control API機能を有効化

2. **APIキーの設定**
   - Voicemodの設定でControl APIを有効にし、APIキーを取得
   - プロジェクトルートに`.env`ファイルを作成
   
```bash
# .env
VITE_VOICEMOD_API_KEY=your_voicemod_api_key_here
```

### MediaPipeモデルファイル

MediaPipeのモデルファイルは自動的にCDNから読み込まれますが、ローカルで使用する場合は：

```bash
# public/modelsディレクトリにモデルファイルを配置
mkdir -p public/models
# holistic.tfliteなどをダウンロードして配置
```

## 使用方法

### 基本的な使い方

1. **アプリケーションの起動**
   - ブラウザで`http://localhost:5173`にアクセス
   - カメラとマイクのアクセス許可を与える

2. **VRMファイルの読み込み**
   - 左パネルの「VRMファイル選択」からVRMファイルを選択
   - モデルが3Dビューに表示される

3. **デバイスの設定**
   - カメラ選択でトラッキング用カメラを選択
   - マイク選択で録音用マイクを選択

4. **トラッキング開始**
   - カメラの前に立つと自動的にトラッキングが開始
   - VRMキャラクターが動きを模倣

5. **録画**
   - 「録画開始」ボタンで録画開始
   - 「録画停止」ボタンで録画終了
   - 「ダウンロード」ボタンで動画ファイルを保存

### 高度な設定

#### トラッキング精度の調整

OneEuroFilterのパラメーター調整：

```typescript
// src/utils/OneEuroFilter.ts
const filter = new OneEuroFilter(
  1.0,  // minCutoff: 低い値ほど滑らか、高い値ほど反応が良い
  0.0,  // beta: 速い動きへの追従性
  1.0   // dCutoff: 微分カットオフ周波数
);
```

#### VRMアニメーションの調整

```typescript
// src/three/VRMAnimator.ts
class VRMAnimator {
  private smoothingFactor = 0.3; // 0-1: 低いほど安定、高いほど反応良い
  
  setSmoothingFactor(factor: number) {
    this.smoothingFactor = factor;
  }
}
```

## API仕様

### VRMViewer Component

```typescript
interface VRMViewerProps {
  vrmFile: File | null;           // VRMファイル
  trackingData: any;              // MediaPipeトラッキングデータ
  onVRMLoaded?: (vrm: VRM) => void; // VRM読み込み完了コールバック
  className?: string;             // CSSクラス
}
```

### VideoRecorder Class

```typescript
interface RecorderOptions {
  videoBitrate?: number;    // ビデオビットレート (default: 8000000)
  audioBitrate?: number;    // オーディオビットレート (default: 128000)
  frameRate?: number;       // フレームレート (default: 30)
  mimeType?: string;        // MIMEタイプ (default: 'video/webm;codecs=vp9')
}
```

### VoicemodAPI Class

```typescript
// Voicemod Control API統合
const voicemod = new VoicemodAPI('your-api-key');
await voicemod.connect();

// ボイスプリセット一覧取得
const voices = await voicemod.getVoices();

// ボイスプリセット設定
await voicemod.setVoice('voice-id');
```

## プロジェクト構成

```
src/
├── components/          # UIコンポーネント (Person A担当)
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── Footer.tsx
├── three/               # 3D関連 (Person B担当)
│   ├── VRMViewer.tsx
│   └── VRMAnimator.ts
├── recorder/            # 録画機能 (Person B担当)
│   ├── VideoRecorder.ts
│   └── VoicemodAPI.ts
├── utils/               # ユーティリティ (Person A担当)
│   ├── OneEuroFilter.ts
│   └── MediaPipeSetup.ts
└── App.tsx              # メインアプリケーション
```

## パフォーマンス最適化

### 推奨設定

- **録画品質**: フルHD (1920x1080) 30fps
- **ビットレート**: Video 8Mbps, Audio 128kbps
- **トラッキング**: 30fps（カメラフレームレートと同期）

### メモリ使用量削減

```typescript
// VRMViewer.tsx でのクリーンアップ
useEffect(() => {
  return () => {
    if (vrmRef.current) {
      VRMUtils.deepDispose(vrmRef.current.scene);
    }
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
  };
}, []);
```

## トラブルシューティング

### よくある問題

1. **カメラが認識されない**
   - ブラウザのカメラ許可を確認
   - 他のアプリケーションがカメラを使用していないか確認

2. **VRMファイルが読み込まれない**
   - ファイル形式がVRM 0.x形式か確認
   - ファイルサイズが大きすぎないか確認（推奨: 50MB以下）

3. **トラッキングが不安定**
   - 照明条件を改善
   - OneEuroFilterのパラメーターを調整

4. **録画で音声が出ない**
   - マイクの許可を確認
   - Voicemod APIの接続状態を確認

5. **FFmpeg.wasmが動作しない**
   - Cross-Origin-Embedder-Policy の設定を確認
   - SharedArrayBufferのサポートを確認

### デバッグ情報

開発者コンソールで以下の情報を確認：

```javascript
// MediaPipe接続状態
console.log(window.mediaPipeStatus);

// VRM読み込み状態
console.log(window.vrmStatus);

// 録画状態
console.log(window.recorderStatus);
```

## ライセンス

MIT License

## 貢献

プルリクエストや Issue の報告を歓迎します。

## クレジット

- [Three.js](https://threejs.org/)
- [@pixiv/three-vrm](https://github.com/pixiv/three-vrm)
- [MediaPipe](https://mediapipe.dev/)
- [FFmpeg.wasm](https://ffmpegwasm.netlify.app/)
- [Voicemod](https://www.voicemod.net/)