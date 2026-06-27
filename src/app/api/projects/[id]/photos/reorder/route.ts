import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { reorderPhotosSchema } from "@/lib/schemas/photo.schema";
import { photoLibraryService } from "@/modules/photo";

interface RouteContext {
  params: Promise<{ id: string }>;
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

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "요청 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const parsed = reorderPhotosSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join("; ");
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  try {
    const photos = await photoLibraryService.reorderPhotos(id, parsed.data.photoIds);
    return NextResponse.json({ success: true, data: photos });
  } catch (error) {
    return errorResponse(error, "사진 정렬에 실패했습니다.");
  }
}
