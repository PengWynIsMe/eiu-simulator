import { useFrame } from '@react-three/fiber';
import { windTime } from './wind';

/** Đồng hồ gió duy nhất: mỗi khung chỉ cộng dt vào uniform dùng chung (không tạo object). */
export default function WindClock() {
  useFrame((_, dt) => {
    windTime.value += Math.min(dt, 0.1);
  });
  return null;
}
