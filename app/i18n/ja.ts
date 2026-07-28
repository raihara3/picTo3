// Japanese message catalog — the source of truth. `Messages` is derived from
// its shape so `en.ts` must provide every key (missing keys = compile error).
// `{name}` style placeholders are filled by the `t()` helper.
export const ja = {
  "common.noUpload": "※サーバーにアップロードすることはありません",

  "header.brandSubtitle": "画像をブラウザだけでglb 3Dモデルに",
  "header.toDark": "ダークモードに切り替え",
  "header.toLight": "ライトモードに切り替え",
  "header.language": "言語を切り替え",

  "service.heading": "このサービスでできること",
  "service.upload.title": "画像から3Dモデルを生成",
  "service.upload.body":
    "画像をアップロードするだけで、透過部分を取り除き、カラー部分の輪郭を立体化したglbを生成します。",
  "service.adjust.title": "なめらかさと厚みを調整",
  "service.adjust.body":
    "輪郭のなめらかさと押し出しの厚みをスライダーで調整して、その場でプレビューできます。",
  "service.export.title": "glbとして書き出し",
  "service.export.body": "生成した3Dモデルはワンクリックで .glb としてダウンロードできます。",

  "dropzone.title": "画像をアップロード",
  "dropzone.hint": "ドラッグ&ドロップ、またはクリック（PNG / WebP / JPG）",
  "upload.error.imageOnly": "画像ファイル（PNG / WebP / JPG / GIF）のみ対応しています",
  "upload.error.decode": "画像を読み込めませんでした",
  "upload.error.empty": "不透明な領域が見つかりませんでした。透過部分のある画像をお試しください",

  "viewer.label": "3Dビュー",
  "viewer.dropHere": "ここに画像をドロップ",
  "viewer.dropReplace": "ここに画像をドロップして差し替え",
  "toolbar.resetView": "視点をリセット",

  "controls.heading": "生成設定はその場で調整できます",
  "controls.settings.label": "メッシュの調整",
  "controls.smoothness": "エッジのなめらかさ",
  "controls.thickness": "厚み",
  "controls.sideColor": "側面の色",
  "controls.sideColor.edge": "境界色",
  "controls.sideColor.custom": "指定色",
  "controls.processing": "生成中…",

  "stats.label": "生成結果",
  "stats.vertices": "頂点数",
  "stats.triangles": "三角形数",

  "export.save": "glbとして保存",

  "footer.replace": "別の画像を選ぶ",
};

export type Messages = typeof ja;
export type MessageKey = keyof Messages;
