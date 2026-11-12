import { Canvas } from '@react-three/fiber';
import Campus from './scene/Campus';
import TopBar from './ui/TopBar';

export default function App() {
  return (
    <div className="relative h-full w-full">
      <Canvas dpr={[1, 2]} camera={{ position: [420, 260, 140], fov: 45, near: 1, far: 3000 }}>
        <color attach="background" args={['#dfe9f0']} />
        <Campus />
      </Canvas>
      <TopBar />
    </div>
  );
}
