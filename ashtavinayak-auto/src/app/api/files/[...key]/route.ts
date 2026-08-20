import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { UPLOAD_ROOT } from "@/lib/storage/local";
import { mimeFor } from "@/lib/storage/validate";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key } = await params;
  const relativePath = key.join("/");

  // Reject traversal attempts and anything outside the upload root.
  const resolved = path.resolve(UPLOAD_ROOT, relativePath);
  if (!resolved.startsWith(UPLOAD_ROOT + path.sep) || relativePath.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const extension = (relativePath.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const file = await readFile(resolved);
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": mimeFor(extension === "jpg" ? "jpg" : extension),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
