// Local preview only. Not deployed — GitHub Pages serves the static files directly.
const root = new URL('.', import.meta.url).pathname;
Bun.serve({
  port: 4173,
  async fetch(req) {
    let p = new URL(req.url).pathname;
    if (p === '/') p = '/index.html';
    const f = Bun.file(root + p.slice(1));
    return (await f.exists()) ? new Response(f) : new Response('404', { status: 404 });
  },
});
console.log('serving diglio on http://localhost:4173');
