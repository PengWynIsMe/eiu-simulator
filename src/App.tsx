import { Canvas } from '@react-three/fiber';
import Campus from './scene/Campus';
import { OVERVIEW_CAMERA } from './scene/CameraRig';
import TopBar from './ui/TopBar';

export default function App() {
  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{
          position: [OVERVIEW_CAMERA.position[0], OVERVIEW_CAMERA.position[1], OVERVIEW_CAMERA.position[2]],
          fov: 45,
          near: 5,
          far: 2500,
        }}
      >
        <Campus />
      </Canvas>
      <TopBar />
    </div>
  );
}
