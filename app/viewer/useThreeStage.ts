import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import type { ImageSource } from "../store/imageStore";
import type { SideColorMode } from "../store/settingsStore";
import { useAnimationStore } from "../store/animationStore";
import { ANIMATIONS, buildAnimationClip, buildAnimationClips, type AnimationId } from "../pipeline/animations";
import { analytics } from "../lib/analytics";
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
  mixer: THREE.AnimationMixer | null;
  /** Model size (world units) used to scale animation amplitudes. */
  reference: number;
}

/** Return a mesh to its neutral pose (used when a preview stops or on export). */
function resetPose(mesh: THREE.Mesh) {
  mesh.position.set(0, 0, 0);
  mesh.quaternion.identity();
  mesh.scale.set(1, 1, 1);
}

/** Play a single preview clip (or clear it), resetting the pose first. */
function applyPreview(refs: StageRefs, id: AnimationId | null) {
  const { mixer, mesh } = refs;
  if (!mixer || !mesh) {
    return;
  }
  mixer.stopAllAction();
  resetPose(mesh);
  if (!id) {
    return;
  }
  const definition = ANIMATIONS.find((animation) => animation.id === id);
  const action = mixer.clipAction(buildAnimationClip(id, refs.reference));
  if (definition?.loop === "once") {
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
  } else {
    action.setLoop(THREE.LoopRepeat, Infinity);
  }
  action.reset().play();
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
  sideColor: string,
  previewId: AnimationId | null
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const refs = useRef<StageRefs | null>(null);
  const framedRef = useRef(false);
  const clockRef = useRef(new THREE.Clock());

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
      mixer: null,
      reference: 1,
    };

    let raf = 0;
    const renderLoop = () => {
      raf = requestAnimationFrame(renderLoop);
      const current = refs.current;
      if (!current) {
        return;
      }
      const delta = clockRef.current.getDelta();
      current.mixer?.update(delta);
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
        current.mixer = null;
      }
      return;
    }
    if (current.mesh) {
      current.mesh.geometry.dispose();
      current.mesh.geometry = geometry;
    } else {
      current.mesh = new THREE.Mesh(geometry, [current.capMaterial, current.sideMaterial]);
      current.scene.add(current.mesh);
      current.mixer = new THREE.AnimationMixer(current.mesh);
    }
    // Size reference for animation amplitudes.
    geometry.computeBoundingBox();
    const size = geometry.boundingBox?.getSize(new THREE.Vector3());
    current.reference = size ? Math.max(size.x, size.y) || 1 : 1;
    if (!framedRef.current) {
      frameObject(current.camera, current.controls, current.mesh);
      framedRef.current = true;
    }
  }, [geometry]);

  // ── Animation preview (one clip at a time) ───────────────────────────────
  useEffect(() => {
    const current = refs.current;
    if (current) {
      applyPreview(current, previewId);
    }
    return () => {
      if (refs.current) {
        applyPreview(refs.current, null);
      }
    };
  }, [previewId, geometry]);

  const resetView = useCallback(() => {
    const current = refs.current;
    if (current?.mesh) {
      frameObject(current.camera, current.controls, current.mesh);
    }
  }, []);

  const exportGlb = useCallback(
    (fileName: string) => {
      const current = refs.current;
      if (!current?.mesh) {
        return;
      }
      // Export from a neutral base pose (the clips carry the motion), then
      // restore whatever was previewing.
      applyPreview(current, null);
      const exportIds = useAnimationStore.getState().exportIds;
      const clips = buildAnimationClips(exportIds, current.reference);
      const finish = () => applyPreview(current, previewId);
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
          analytics.modelExport({
            side_color: sideColorMode,
            has_animation: exportIds.length > 0,
            file_size_kb: Math.round(blob.size / 1024),
          });
          finish();
        },
        () => finish(),
        { binary: true, animations: clips }
      );
    },
    [previewId, sideColorMode]
  );

  return { containerRef, resetView, exportGlb };
}

export type StageController = ReturnType<typeof useThreeStage>;
