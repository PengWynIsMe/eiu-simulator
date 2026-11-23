import fs from 'fs';
import path from 'path';


for (const name of [
  'b3-thang-t1.png',
  'b3-thang-t2.png',
  'b8-thang-giua-bac-t1.png',
  'b8-thang-giua-bac-t2.png',
  'b8-thang-loi-dong-t1.png',
  'b11-thang-tay-bac-t1.png',
  'b11-thang-tay-bac-t2.png'
]) {
  const p1 = path.resolve('docs/tasks/FIX-NT-anh/before-24483be', name);
  const p2 = path.resolve('docs/tasks/FIX-NT-anh/after-b90da88', name);
  if (fs.existsSync(p1) && fs.existsSync(p2)) {
    const b1 = fs.readFileSync(p1);
    const b2 = fs.readFileSync(p2);
    console.log(`${name}: before=${b1.length} bytes, after=${b2.length} bytes, identical=${b1.equals(b2)}`);
  }
}
