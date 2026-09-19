import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { brotliCompress, constants, gzip } from "node:zlib";
import { promisify } from "node:util";

const brotli = promisify(brotliCompress);
const gzipAsync = promisify(gzip);
const dist = join(import.meta.dirname, "..", "dist");
const COMPRESSIBLE = new Set([".css", ".html", ".js", ".json", ".svg", ".txt"]);
const MIN_BYTES = 1024;

async function filesUnder(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? filesUnder(path) : [path];
    }),
  );
  return nested.flat();
}

const files = (await filesUnder(dist)).filter(
  (file) => COMPRESSIBLE.has(extname(file)) && !file.endsWith(".br") && !file.endsWith(".gz"),
);

await Promise.all(
  files.map(async (file) => {
    const source = await readFile(file);
    if (source.byteLength < MIN_BYTES) return;
    const [br, gz] = await Promise.all([
      brotli(source, {
        params: {
          [constants.BROTLI_PARAM_QUALITY]: 9,
          [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
        },
      }),
      gzipAsync(source, { level: 9 }),
    ]);
    await Promise.all([writeFile(`${file}.br`, br), writeFile(`${file}.gz`, gz)]);
  }),
);
