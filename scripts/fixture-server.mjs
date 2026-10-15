import http from 'node:http';
import fs from 'node:fs/promises';
export async function fixtureServer(samplePath) {
  const sample = await fs.readFile(samplePath);
  const server = http.createServer((req, res) => {
    if (req.url.startsWith('/sample.mp4')) {
      const range = req.headers.range?.match(/bytes=(\d+)-(\d*)/);
      const start = range ? Number(range[1]) : 0,
        end = range?.[2] ? Number(range[2]) : sample.length - 1;
      res.writeHead(range ? 206 : 200, {
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        ...(range ? { 'Content-Range': `bytes ${start}-${end}/${sample.length}` } : {}),
      });
      res.end(sample.subarray(start, end + 1));
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Content-Security-Policy': "require-trusted-types-for 'script'; trusted-types 'none'",
    });
    res.end(
      '<!doctype html><title>Perch native test</title><video loop playsinline src="/sample.mp4"></video>',
    );
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
