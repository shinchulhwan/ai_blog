import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import {
  createProjectSchema,
  projectListQuerySchema,
} from "@/lib/schemas/project.schema";
import { projectService } from "@/modules/project";

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = projectListQuerySchema.safeParse({
      status: searchParams.get("status") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });

    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join("; ");
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    const projects = await projectService.list(parsed.data);
    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    return errorResponse(error, "프로젝트 목록을 불러오지 못했습니다.");
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "요청 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join("; ");
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  try {
    const project = await projectService.create(parsed.data);
    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "프로젝트를 생성하지 못했습니다.");
  }
}
