import { NextResponse } from "next/server";

import { requireSession } from "@/lib/server/require-session";
import { getPhotoById } from "@/lib/server/dal/photos";
import { storage } from "@/lib/server/storage";
import { ForbiddenError, UnauthenticatedError } from "@/lib/server/errors";

export const runtime = "nodejs";

/**
 * The ONLY way a photo's bytes ever reach a browser. Never served from
 * public/ — this route re-verifies the requester owns (or administers) the
 * photo via `getPhotoById` (which runs the same `assertOwnedByFarmer`/
 * `assertRecordAccess` guards as every other DAL read) before touching the
 * storage provider. A farmer changing this URL's [id] to another farmer's
 * photo gets a 403, not the image.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const session = await requireSession();
    const photo = await getPhotoById(session, id);
    if (!photo) return new NextResponse("Not found", { status: 404 });

    const buffer = await storage.read(photo.storageKey);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": photo.mimeType,
        // Private — this is access-controlled content, never a shared/public cache.
        "Cache-Control": "private, max-age=3600",
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (error) {
    if (error instanceof UnauthenticatedError) return new NextResponse("Unauthorized", { status: 401 });
    if (error instanceof ForbiddenError) return new NextResponse("Forbidden", { status: 403 });
    return new NextResponse("Not found", { status: 404 });
  }
}
