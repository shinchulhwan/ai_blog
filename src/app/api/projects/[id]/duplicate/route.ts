import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { projectService } from "@/modules/project";

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

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const project = await projectService.duplicate(id);
    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "프로젝트를 복제하지 못했습니다.");
  }
}
