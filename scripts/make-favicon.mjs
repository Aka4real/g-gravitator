// Regenerates app/favicon.ico from the live brand icon (PNG embedded in an ICO container).
// Usage: start `npm run dev`, then `node scripts/make-favicon.mjs [baseUrl]`
import { writeFile } from "node:fs/promises";

const base = process.argv[2] ?? "http://localhost:3000";
const png = Buffer.from(await (await fetch(`${base}/icon`)).arrayBuffer());
const size = png.readUInt32BE(16); // PNG IHDR width (square icon)

const header = Buffer.alloc(6);
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // one image
const entry = Buffer.alloc(16);
entry.writeUInt8(size >= 256 ? 0 : size, 0);
entry.writeUInt8(size >= 256 ? 0 : size, 1);
entry.writeUInt16LE(1, 4); // planes
entry.writeUInt16LE(32, 6); // bit depth
entry.writeUInt32LE(png.length, 8);
entry.writeUInt32LE(header.length + entry.length, 12);

await writeFile(new URL("../app/favicon.ico", import.meta.url), Buffer.concat([header, entry, png]));
console.log(`favicon.ico written (${size}x${size}, ${png.length} bytes PNG)`);
