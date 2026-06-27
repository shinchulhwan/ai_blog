import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
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

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const data = await photoLibraryService.getLibraryWithPhotos(id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error, "Photo Library를 불러오지 못했습니다.");
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "요청 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const entries = formData.getAll("files");
  const files = entries.filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    return NextResponse.json(
      { success: false, error: "업로드할 이미지를 선택해 주세요." },
      { status: 400 },
    );
  }

  try {
    const uploads = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        mimeType: file.type,
        buffer: Buffer.from(await file.arrayBuffer()),
      })),
    );

    const photos = await photoLibraryService.uploadPhotos(id, uploads);
    return NextResponse.json({ success: true, data: photos });
  } catch (error) {
    return errorResponse(error, "이미지 업로드에 실패했습니다.");
  }
}
