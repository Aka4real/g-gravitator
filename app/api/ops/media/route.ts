import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth/admin-auth";
import {
  appendAuditLog,
  deleteMediaAsset,
  listMediaAssets,
} from "@/lib/db/repository";
import {
  generateAndStoreImage,
  importAndStoreImageFromUrl,
  uploadAndStoreImage,
} from "@/lib/ops/media";

export const maxDuration = 60;

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const assets = await listMediaAssets();
  return NextResponse.json({
    assets: assets.map((m) => ({
      id: m.id,
      filename: m.filename,
      mime_type: m.mime_type,
      url: m.url,
      source_type: m.source_type,
      source_url: m.source_url,
      prompt: m.prompt,
      alt_text: m.alt_text,
      created_by: m.created_by,
      created_at: m.created_at,
    })),
  });
}

export async function POST(request: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      action?: "generate" | "import" | "upload";
      prompt?: string;
      title?: string;
      subtitle?: string;
      accentColor?: string;
      category?: string;
      url?: string;
      altText?: string;
      filename?: string;
      mimeType?: string;
      base64Data?: string;
    };

    if (body.action === "import") {
      if (!body.url) {
        return NextResponse.json({ error: "Image URL is required." }, { status: 400 });
      }
      const asset = await importAndStoreImageFromUrl({
        url: body.url,
        altText: body.altText,
        createdBy: "admin",
      });
      await appendAuditLog({
        actor_type: "admin",
        actor_label: admin.email,
        action: "import_media",
        entity_type: "media_assets",
        entity_id: asset.id,
        summary: `Imported image ${asset.filename}`,
        status: "ok",
      });
      return NextResponse.json({ ok: true, asset }, { status: 201 });
    }

    if (body.action === "upload") {
      if (!body.base64Data || !body.mimeType) {
        return NextResponse.json(
          { error: "File data and MIME type are required." },
          { status: 400 }
        );
      }
      const asset = await uploadAndStoreImage({
        filename: body.filename || "upload.png",
        mimeType: body.mimeType,
        base64Data: body.base64Data,
        altText: body.altText,
        createdBy: "admin",
      });
      await appendAuditLog({
        actor_type: "admin",
        actor_label: admin.email,
        action: "upload_media",
        entity_type: "media_assets",
        entity_id: asset.id,
        summary: `Uploaded image ${asset.filename}`,
        status: "ok",
      });
      return NextResponse.json({ ok: true, asset }, { status: 201 });
    }

    // Default: generate
    const prompt = (body.prompt || body.title || "").trim();
    if (!prompt) {
      return NextResponse.json(
        { error: "Provide an image prompt or post title." },
        { status: 400 }
      );
    }

    const { asset, generator } = await generateAndStoreImage({
      prompt,
      title: body.title,
      subtitle: body.subtitle,
      accentColor: body.accentColor,
      category: body.category,
      createdBy: "admin",
    });

    await appendAuditLog({
      actor_type: "admin",
      actor_label: admin.email,
      action: "generate_media",
      entity_type: "media_assets",
      entity_id: asset.id,
      summary: `Generated ${generator} visual (${asset.filename})`,
      status: "ok",
    });

    return NextResponse.json({ ok: true, asset, generator }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Media operation failed" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") || "";
  if (!id) {
    return NextResponse.json({ error: "Missing media ID" }, { status: 400 });
  }

  const deleted = await deleteMediaAsset(id);
  return NextResponse.json({ ok: deleted, deleted, id });
}
