import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { updateProjectSchema } from "@/lib/schemas/project.schema";
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

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const project = await projectService.getById(id);

    if (!project) {
      return NextResponse.json(
        { success: false, error: "프로젝트를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const [prompts, knowledge] = await Promise.all([
      projectService.listPrompts(id),
      projectService.listKnowledge(id),
    ]);

    return NextResponse.json({
      success: true,
      data: { project, prompts, knowledge },
    });
  } catch (error) {
    return errorResponse(error, "프로젝트 정보를 불러오지 못했습니다.");
  }
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

  const parsed = updateProjectSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join("; ");
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  try {
    const project = await projectService.update(id, parsed.data);
    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    return errorResponse(error, "프로젝트를 수정하지 못했습니다.");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    await projectService.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "프로젝트를 삭제하지 못했습니다.");
  }
}
