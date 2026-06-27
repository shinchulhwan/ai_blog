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

export async function DELETE(_request: Request, context: RouteContext) {
  const { id, photoId } = await context.params;

  try {
    await photoLibraryService.deletePhoto(id, photoId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "사진 삭제에 실패했습니다.");
  }
}
