import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import type { ImageSource } from "../store/imageStore";
import type { SideColorMode } from "../store/settingsStore";
import { createTextureSource } from "./textureSource";

interface StageRefs {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  capMaterial: THREE.MeshStandardMaterial;
  sideMaterial: THREE.MeshStandardMaterial;
  texture: THREE.Texture | null;
  mesh: THREE.Mesh | null;
}

/** Frame the camera on an object's bounding box. */
function frameObject(camera: THREE.PerspectiveCamera, controls: OrbitControls, object: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const fov = camera.fov * (Math.PI / 180);
  const distance = (Math.abs(maxDim / 2 / Math.tan(fov / 2)) || 1) * 1.6;
  camera.position.set(center.x, center.y, center.z + distance);
  camera.near = distance / 100;
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
  camera.lookAt(center);
  controls.target.copy(center);
  controls.update();
}

/**
 * Owns the three.js stage for picTo3. Renders the extruded silhouette mesh built
 * by the pipeline, textured with the source image; exposes reset-view and glb
 * export. Plain three.js behind a thin hook — three objects live in refs.
 */
export function useThreeStage(
  geometry: THREE.BufferGeometry | null,
  source: ImageSource | null,
  sideColorMode: SideColorMode,
  sideColor: string
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const refs = useRef<StageRefs | null>(null);
  const framedRef = useRef(false);

  // Keep the side-wall material in sync with the chosen mode/colour. In "edge"
  // mode the walls sample the image (boundary colour via the side-wall UVs); in
  // "custom" mode they use a flat colour. Reads from refs so both this effect
  // and the texture effect can re-apply it.
  const applySideMaterial = useCallback(() => {
    const current = refs.current;
    if (!current) {
      return;
    }
    if (sideColorMode === "edge") {
      current.sideMaterial.map = current.texture;
      current.sideMaterial.color.set(0xffffff);
    } else {
      current.sideMaterial.map = null;
      current.sideMaterial.color.set(sideColor);
    }
    current.sideMaterial.needsUpdate = true;
  }, [sideColorMode, sideColor]);

  // ── Stage lifecycle (mount once) ─────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, width / height || 1, 0.1, 1000);
    camera.position.set(0, 0, 3);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    container.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment()).texture;

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 1.1);
    directional.position.set(3, 4, 5);
    scene.add(directional);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const capMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.85,
      metalness: 0,
    });
    const sideMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.9,
      metalness: 0,
    });

    refs.current = {
      renderer,
      scene,
      camera,
      controls,
      capMaterial,
      sideMaterial,
      texture: null,
      mesh: null,
    };

    let raf = 0;
    const renderLoop = () => {
      raf = requestAnimationFrame(renderLoop);
      const current = refs.current;
      if (!current) {
        return;
      }
      current.controls.update();
      current.renderer.render(current.scene, current.camera);
    };
    renderLoop();

    const handleResize = () => {
      const current = refs.current;
      if (!current || !container.clientWidth) {
        return;
      }
      const nextWidth = container.clientWidth;
      const nextHeight = container.clientHeight;
      current.camera.aspect = nextWidth / nextHeight;
      current.camera.updateProjectionMatrix();
      current.renderer.setSize(nextWidth, nextHeight);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      const current = refs.current;
      current?.mesh?.geometry.dispose();
      current?.texture?.dispose();
      current?.capMaterial.dispose();
      current?.sideMaterial.dispose();
      pmrem.dispose();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      refs.current = null;
    };
  }, []);

  // ── Texture follows the source image ─────────────────────────────────────
  useEffect(() => {
    const current = refs.current;
    if (!current) {
      return;
    }
    current.texture?.dispose();
    if (!source) {
      current.texture = null;
      current.capMaterial.map = null;
      current.capMaterial.needsUpdate = true;
      applySideMaterial();
      return;
    }
    const textureSource = createTextureSource(source.image, source.naturalWidth, source.naturalHeight);
    const texture = new THREE.Texture(textureSource);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = current.renderer.capabilities.getMaxAnisotropy();
    texture.needsUpdate = true;
    current.texture = texture;
    current.capMaterial.map = texture;
    current.capMaterial.needsUpdate = true;
    applySideMaterial();
    framedRef.current = false; // re-frame on the next geometry for a new image
  }, [source, applySideMaterial]);

  // ── Side-wall material follows the chosen colour mode ────────────────────
  useEffect(() => {
    applySideMaterial();
  }, [applySideMaterial]);

  // ── Mesh follows the generated geometry ──────────────────────────────────
  useEffect(() => {
    const current = refs.current;
    if (!current) {
      return;
    }
    if (!geometry) {
      if (current.mesh) {
        current.scene.remove(current.mesh);
        current.mesh.geometry.dispose();
        current.mesh = null;
      }
      return;
    }
    if (current.mesh) {
      current.mesh.geometry.dispose();
      current.mesh.geometry = geometry;
    } else {
      current.mesh = new THREE.Mesh(geometry, [current.capMaterial, current.sideMaterial]);
      current.scene.add(current.mesh);
    }
    if (!framedRef.current) {
      frameObject(current.camera, current.controls, current.mesh);
      framedRef.current = true;
    }
  }, [geometry]);

  const resetView = useCallback(() => {
    const current = refs.current;
    if (current?.mesh) {
      frameObject(current.camera, current.controls, current.mesh);
    }
  }, []);

  const exportGlb = useCallback((fileName: string) => {
    const current = refs.current;
    if (!current?.mesh) {
      return;
    }
    const exporter = new GLTFExporter();
    exporter.parse(
      current.mesh,
      (result) => {
        const blob = new Blob([result as ArrayBuffer], { type: "model/gltf-binary" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
      },
      () => {
        /* export error — nothing to download */
      },
      { binary: true }
    );
  }, []);

  return { containerRef, resetView, exportGlb };
}

export type StageController = ReturnType<typeof useThreeStage>;
