import { CanvasTexture, DoubleSide } from 'three';

let sharedShadowTex: CanvasTexture | null = null;

function getShadowTexture(): CanvasTexture {
  if (sharedShadowTex) return sharedShadowTex;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.55)');
    grad.addColorStop(0.55, 'rgba(15, 23, 42, 0.25)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  sharedShadowTex = new CanvasTexture(canvas);
  sharedShadowTex.needsUpdate = true;
  return sharedShadowTex;
}

const NO_RAYCAST = () => undefined;

export default function ContactShadow({ radius = 0.55, opacity = 0.5 }: { radius?: number; opacity?: number }) {
  const tex = getShadowTexture();
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={0.04} raycast={NO_RAYCAST} renderOrder={2}>
      <circleGeometry args={[radius, 18]} />
      <meshBasicMaterial
        map={tex}
        transparent
        opacity={opacity}
        depthWrite={false}
        side={DoubleSide}
      />
    </mesh>
  );
}
