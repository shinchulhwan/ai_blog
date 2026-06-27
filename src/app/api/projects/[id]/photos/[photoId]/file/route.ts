import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { photoLibraryService } from "@/modules/photo";

interface RouteContext {
  params: Promise<{ id: string; photoId: string }>;
}

function errorResponse(error: unknown, fallback: string) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode },
    );
  }

  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}

export async function GET(_request: Request, context: RouteContext) {
  const { id, photoId } = await context.params;

  try {
    const file = await photoLibraryService.getPhotoFile(id, photoId);

    return new NextResponse(new Uint8Array(file.buffer), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `inline; filename="${file.storedName}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return errorResponse(error, "이미지 파일을 불러오지 못했습니다.");
  }
}
