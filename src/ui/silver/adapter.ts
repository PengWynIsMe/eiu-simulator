import type { UseSilver } from '../../types/silver';
import { useSilverStore } from '../../store/useSilverStore';

const check: UseSilver = useSilverStore;
void check;

export { useSilverStore as useSilver };
