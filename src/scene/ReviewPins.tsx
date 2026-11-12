import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import type { ReviewNote } from '../types';
import { useReviewStore } from '../store/useReviewStore';

function SinglePin({ note, index, isSelected }: { note: ReviewNote; index: number; isSelected: boolean }) {
  const pinColor = isSelected
    ? '#f59e0b' // vàng hổ phách khi được chọn
    : note.status === 'da-sua'
    ? '#10b981' // xanh lá khi đã sửa
    : '#ef4444'; // đỏ khi đang mở

  const emissiveIntensity = isSelected ? 0.6 : 0.3;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 4) return;
    useReviewStore.getState().selectNote(note.id);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'auto';
  };

  return (
    <group
      position={note.point}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Chân ghim (stem) cắm vào bề mặt */}
      <mesh position-y={1.3} castShadow>
        <cylinderGeometry args={[0.12, 0.04, 2.6, 8]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Đầu ghim tròn nổi bật */}
      <mesh position-y={2.9} castShadow>
        <sphereGeometry args={[0.65, 16, 16]} />
        <meshStandardMaterial
          color={pinColor}
          roughness={0.25}
          metalness={0.2}
          emissive={pinColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Nhãn số thứ tự của ghim */}
      <Html
        position={[0, 4.0, 0]}
        center
        style={{ pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap' }}
      >
        <div
          className={`flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-bold rounded-full shadow-lg border text-white transition-all ${
            isSelected
              ? 'bg-amber-500 border-amber-200 ring-4 ring-amber-400/40 scale-125 z-10'
              : note.status === 'da-sua'
              ? 'bg-emerald-600 border-emerald-300/80 ring-2 ring-emerald-500/30'
              : 'bg-rose-600 border-rose-300/80 ring-2 ring-rose-500/30'
          }`}
        >
          {index + 1}
        </div>
      </Html>
    </group>
  );
}

/** Ghim tạm thời tại điểm người dùng vừa bấm khi đang soạn góp ý */
function DraftPin({ point }: { point: [number, number, number] }) {
  return (
    <group position={point}>
      <mesh position-y={1.3} castShadow>
        <cylinderGeometry args={[0.12, 0.04, 2.6, 8]} />
        <meshStandardMaterial color="#fed7aa" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position-y={2.9} castShadow>
        <sphereGeometry args={[0.65, 16, 16]} />
        <meshStandardMaterial
          color="#f97316"
          roughness={0.25}
          metalness={0.2}
          emissive="#ea580c"
          emissiveIntensity={0.8}
        />
      </mesh>
      <Html
        position={[0, 4.0, 0]}
        center
        style={{ pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap' }}
      >
        <div className="flex items-center justify-center h-6 px-2 text-xs font-bold rounded-full shadow-lg border border-orange-200 bg-orange-500 text-white animate-pulse">
          Mới
        </div>
      </Html>
    </group>
  );
}

export default function ReviewPins() {
  const reviewMode = useReviewStore((s) => s.reviewMode);
  const notes = useReviewStore((s) => s.notes);
  const selectedNoteId = useReviewStore((s) => s.selectedNoteId);
  const draft = useReviewStore((s) => s.draft);

  // Ghim chỉ hiện khi ở chế độ góp ý
  if (!reviewMode) return null;

  return (
    <group>
      {notes.map((note, idx) => (
        <SinglePin
          key={note.id}
          note={note}
          index={idx}
          isSelected={note.id === selectedNoteId}
        />
      ))}

      {draft && <DraftPin point={draft.point} />}
    </group>
  );
}
