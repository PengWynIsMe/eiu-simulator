import Environment from './Environment';
import Ground from './Ground';
import Trees from './Trees';
import Building from './Building';
import CameraRig from './CameraRig';
import { campus } from '../data';

export default function Campus() {
  const { buildings } = campus;

  return (
    <>
      <Environment />
      <Ground />
      <Trees />
      {buildings.map((b) => (
        <Building key={b.id} building={b} />
      ))}
      <CameraRig />
    </>
  );
}
