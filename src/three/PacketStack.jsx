import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame, useSceneScroll, usePagePointer, useScene, ContactShadows } from "@wron/kit/3d/objects";

const W = 1.7;
const H = 2.2;
const D = 0.014;
const N = 8;
const { damp, lerp, clamp } = THREE.MathUtils;

function paperTexture(top) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 662;
  const g = c.getContext("2d");
  g.fillStyle = "#FBFAF6";
  g.fillRect(0, 0, 512, 662);
  if (top) {
    g.fillStyle = "#D3D8D5";
    g.fillRect(56, 72, 150, 14);
    g.fillStyle = "#DEE3E0";
    [0.92, 0.86, 0.9, 0.7, 0.88, 0.8, 0.6, 0, 0.9, 0.84, 0.66, 0, 0.88, 0.8, 0.52].forEach((w, i) => {
      if (w) g.fillRect(56, 128 + i * 30, 400 * w, 7);
    });
  } else {
    g.fillStyle = "#EDF0EE";
    for (let i = 0; i < 10; i++) g.fillRect(56, 128 + i * 40, 380, 6);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export default function PacketStack({ settled = false }) {
  const group = useRef(null);
  const sheets = useRef([]);
  const prog = useRef(0);
  const base = useRef(null);
  const scroll = useSceneScroll();
  const pointer = usePagePointer();
  const { reduce, small } = useScene();

  const mats = useMemo(() => {
    const edge = new THREE.MeshStandardMaterial({ color: "#C9D8D0", roughness: 0.85 });
    const back = new THREE.MeshStandardMaterial({ color: "#F3F1EB", roughness: 0.95 });
    const plain = new THREE.MeshStandardMaterial({ map: paperTexture(false), roughness: 0.92 });
    const top = new THREE.MeshStandardMaterial({ map: paperTexture(true), roughness: 0.92 });
    return {
      plain: [edge, edge, edge, edge, plain, back],
      top: [edge, edge, edge, edge, top, back],
      green: new THREE.MeshStandardMaterial({ color: "#0E7A54", roughness: 0.55 }),
      orange: new THREE.MeshStandardMaterial({ color: "#E4572E", roughness: 0.55 }),
    };
  }, []);

  useFrame((state, dt) => {
    const step = Math.min(dt, 0.05);
    prog.current = reduce || settled ? 1 : damp(prog.current, 1, 1.9, step);
    const p = prog.current;
    const sc = scroll.current ?? 0;
    if (base.current === null) base.current = sc;
    const s = reduce ? 0 : clamp((sc - base.current) / 0.2, 0, 1);
    const mid = (N - 1) / 2;

    sheets.current.forEach((m, i) => {
      if (!m) return;
      const c = i - mid;
      const tight = 1 - s * 0.65;
      const fx = c * 0.34;
      const fy = c * 0.03 - Math.abs(c) * 0.03;
      const fz = i * 0.11;
      const fr = -c * 0.085;
      const sx = c * 0.085 * tight;
      const sy = -c * 0.04 * tight;
      const sz = i * 0.05 * tight;
      m.position.set(lerp(fx, sx, p), lerp(fy, sy, p), lerp(fz, sz, p));
      m.rotation.z = lerp(fr, 0, p);
    });

    if (group.current) {
      const g = group.current;
      const tilt = reduce ? 0 : 0.087;
      g.rotation.x = damp(g.rotation.x, -0.22 - pointer.y * tilt, 4, step);
      g.rotation.y = damp(g.rotation.y, 0.48 + pointer.x * tilt, 4, step);
      g.position.y = damp(g.position.y, 0.12 - s * 0.32, 5, step);
    }
  });

  return (
    <>
      <group ref={group} rotation={[-0.22, 0.48, 0.16]} position={[0, 0.12, 0]} scale={small ? 0.92 : 1}>
        {Array.from({ length: N }).map((_, i) => (
          <group key={i} ref={(el) => (sheets.current[i] = el)}>
            <mesh material={i === N - 1 ? mats.top : mats.plain} castShadow>
              <boxGeometry args={[W, H, D]} />
            </mesh>
            <mesh material={i === 0 ? mats.orange : mats.green} position={[-W / 2 + 0.24 + i * 0.165, H / 2 + 0.012, 0]}>
              <boxGeometry args={[0.17, 0.09, D * 1.4]} />
            </mesh>
          </group>
        ))}
      </group>
      <ContactShadows position={[0, -1.6, 0]} opacity={0.32} blur={2.6} scale={7} far={2.4} />
    </>
  );
}
