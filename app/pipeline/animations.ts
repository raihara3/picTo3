import * as THREE from "three";

/** The five procedural idle/intro animations picTo3 can bake into a glb. */
export type AnimationId = "float" | "jump" | "sway" | "wake" | "pop";

export interface AnimationDef {
  id: AnimationId;
  /** `repeat` = looping idle; `once` = one-shot intro (holds on the last frame). */
  loop: "repeat" | "once";
  /** Clip name written into the exported glb (kept ASCII for compatibility). */
  clipName: string;
}

export const ANIMATIONS: AnimationDef[] = [
  { id: "float", loop: "repeat", clipName: "Float" },
  { id: "jump", loop: "repeat", clipName: "Jump" },
  { id: "sway", loop: "repeat", clipName: "Sway" },
  { id: "wake", loop: "once", clipName: "WakeUp" },
  { id: "pop", loop: "once", clipName: "PopIn" },
];

const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/** Evenly spaced sample times across `duration` (inclusive of both ends). */
function sampleTimes(duration: number, count: number): number[] {
  const times = new Array<number>(count);
  for (let i = 0; i < count; i += 1) {
    times[i] = (i / (count - 1)) * duration;
  }
  return times;
}

/** Bake an Euler-per-sample rotation into a flat quaternion value array. */
function quaternionValues(times: number[], angleAt: (u: number) => THREE.Euler): number[] {
  const quaternion = new THREE.Quaternion();
  const values: number[] = [];
  for (let i = 0; i < times.length; i += 1) {
    quaternion.setFromEuler(angleAt(i / (times.length - 1)));
    values.push(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
  }
  return values;
}

/**
 * Build one animation clip. Tracks target the mesh root directly
 * (`.position` / `.quaternion` / `.scale`), so the clip binds both to an
 * `AnimationMixer(mesh)` for preview and to the exported node in the glb.
 * `reference` is the model's size (world units) so amplitudes scale with it.
 */
export function buildAnimationClip(id: AnimationId, reference: number): THREE.AnimationClip {
  const ref = reference > 0 ? reference : 1;
  const euler = new THREE.Euler();

  switch (id) {
    case "float": {
      const duration = 2.8;
      const times = sampleTimes(duration, 41);
      const amplitude = 0.09 * ref;
      const values: number[] = [];
      for (const time of times) {
        values.push(0, amplitude * Math.sin((time / duration) * Math.PI * 2), 0);
      }
      return new THREE.AnimationClip("Float", duration, [
        new THREE.VectorKeyframeTrack(".position", times, values),
      ]);
    }

    case "jump": {
      const duration = 1.8;
      const airborne = 0.5; // seconds of the cycle spent in the hop
      const peak = 0.34 * ref;
      const times = sampleTimes(duration, 61);
      const values: number[] = [];
      for (const time of times) {
        const y = time < airborne ? peak * Math.sin(Math.PI * (time / airborne)) : 0;
        values.push(0, y, 0);
      }
      return new THREE.AnimationClip("Jump", duration, [
        new THREE.VectorKeyframeTrack(".position", times, values),
      ]);
    }

    case "sway": {
      const duration = 2.6;
      const angle = 0.16; // rad (~9°)
      const times = sampleTimes(duration, 41);
      const values = quaternionValues(times, (u) => {
        euler.set(0, 0, angle * Math.sin(u * Math.PI * 2));
        return euler;
      });
      return new THREE.AnimationClip("Sway", duration, [
        new THREE.QuaternionKeyframeTrack(".quaternion", times, values),
      ]);
    }

    case "wake": {
      const duration = 1.7;
      const hold = 0.4; // fraction of the clip spent lying flat before rising
      const times = sampleTimes(duration, 37);
      // Lie flat (tilted -90° toward the viewer) for a beat, then rise to
      // upright with a slight overshoot as it settles. Pivots from the base.
      const values = quaternionValues(times, (u) => {
        const progress = u <= hold ? 0 : easeOutBack((u - hold) / (1 - hold));
        euler.set(-(Math.PI / 2) * (1 - progress), 0, 0);
        return euler;
      });
      return new THREE.AnimationClip("WakeUp", duration, [
        new THREE.QuaternionKeyframeTrack(".quaternion", times, values),
      ]);
    }

    case "pop": {
      const duration = 0.8;
      const times = sampleTimes(duration, 33);
      const jumpPeak = 0.28 * ref;
      const scaleValues: number[] = [];
      const positionValues: number[] = [];
      for (let i = 0; i < times.length; i += 1) {
        const u = i / (times.length - 1);
        // Scale 0 → 1 with a springy overshoot ("ぴょーん")...
        const scale = Math.max(0, easeOutBack(u));
        scaleValues.push(scale, scale, scale);
        // ...while hopping up and landing back on the origin at the end.
        positionValues.push(0, jumpPeak * Math.sin(Math.PI * u), 0);
      }
      scaleValues[0] = scaleValues[1] = scaleValues[2] = 0; // exact zero at the start
      return new THREE.AnimationClip("PopIn", duration, [
        new THREE.VectorKeyframeTrack(".scale", times, scaleValues),
        new THREE.VectorKeyframeTrack(".position", times, positionValues),
      ]);
    }
  }
}

/** Build clips for a set of ids, preserving the canonical ANIMATIONS order. */
export function buildAnimationClips(ids: AnimationId[], reference: number): THREE.AnimationClip[] {
  return ANIMATIONS.filter((animation) => ids.includes(animation.id)).map((animation) =>
    buildAnimationClip(animation.id, reference)
  );
}
