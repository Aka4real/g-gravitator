import { NextResponse } from "next/server";
import { getMediaAssetById } from "@/lib/db/repository";
import { parseDataUrlToBuffer } from "@/lib/ops/media";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const asset = await getMediaAssetById(id);
  if (!asset) {
    return NextResponse.json({ error: "Media asset not found" }, { status: 404 });
  }

  const parsed = parseDataUrlToBuffer(asset.data_url);
  if (!parsed) {
    return NextResponse.json({ error: "Corrupted media payload" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const download = searchParams.get("download") === "1";

  return new NextResponse(new Uint8Array(parsed.buffer), {
    status: 200,
    headers: {
      "Content-Type": parsed.mimeType || asset.mime_type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      ...(download
        ? {
            "Content-Disposition": `attachment; filename="${asset.filename}"`,
          }
        : {}),
    },
  });
}
