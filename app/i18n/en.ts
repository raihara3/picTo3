import type { Messages } from "./ja";

// English catalog. Must provide every key in `Messages` (enforced by the type).
export const en: Messages = {
  "common.noUpload": "Files never leave your browser",

  "header.brandSubtitle": "Turn an image into a glb 3D model, in the browser",
  "header.toDark": "Switch to dark mode",
  "header.toLight": "Switch to light mode",
  "header.language": "Switch language",

  "service.heading": "What you can do here",
  "service.upload.title": "Generate a 3D model from an image",
  "service.upload.body":
    "Just upload an image — the transparent areas are removed and the outline of the colored area is extruded into a glb.",
  "service.adjust.title": "Tune smoothness and thickness",
  "service.adjust.body":
    "Adjust the edge smoothness and extrusion thickness with sliders and preview the result instantly.",
  "service.export.title": "Export as glb",
  "service.export.body": "Download the generated 3D model as a .glb with a single click.",

  "dropzone.title": "Upload an image",
  "dropzone.hint": "Drag & drop, or click (PNG / WebP / JPG)",
  "upload.error.imageOnly": "Only image files (PNG / WebP / JPG / GIF) are supported",
  "upload.error.decode": "Could not read the image",
  "upload.error.empty": "No opaque area found. Try an image with transparency",

  "viewer.label": "3D view",
  "viewer.dropHere": "Drop an image here",
  "viewer.dropReplace": "Drop an image here to replace",
  "toolbar.resetView": "Reset view",

  "controls.heading": "Adjust the generation settings on the fly",
  "controls.settings.label": "Mesh adjustment",
  "controls.smoothness": "Edge smoothness",
  "controls.thickness": "Thickness",
  "controls.roundness": "Roundness (front/back bulge)",
  "controls.sideColor": "Side color",
  "controls.sideColor.edge": "Edge color",
  "controls.sideColor.custom": "Custom",
  "controls.processing": "Generating…",

  "stats.label": "Result",
  "stats.vertices": "Vertices",
  "stats.triangles": "Triangles",

  "export.save": "Save as glb",

  "footer.replace": "Choose another image",
};
