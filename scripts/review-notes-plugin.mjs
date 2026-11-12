// Plugin Vite (chỉ chạy khi `npm run dev`): app gọi /__review/notes để đọc/ghi review/notes.json.
import { readFile, writeFile } from 'node:fs/promises';

const FILE = new URL('../review/notes.json', import.meta.url);
const ROUTE = '/__review/notes';

export default function reviewNotesPlugin() {
  return {
    name: 'campussim-review-notes',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(ROUTE, async (req, res) => {
        try {
          if (req.method === 'GET') {
            const text = await readFile(FILE, 'utf8').catch(() => '[]');
            res.setHeader('Content-Type', 'application/json');
            res.end(text);
            return;
          }
          if (req.method === 'PUT') {
            let body = '';
            for await (const chunk of req) body += chunk;
            const notes = JSON.parse(body);
            if (!Array.isArray(notes)) throw new Error('Cần mảng ghi chú');
            await writeFile(FILE, JSON.stringify(notes, null, 2) + '\n');
            res.statusCode = 204;
            res.end();
            return;
          }
          res.statusCode = 405;
          res.end();
        } catch (err) {
          res.statusCode = 400;
          res.end(String(err));
        }
      });
    },
  };
}
