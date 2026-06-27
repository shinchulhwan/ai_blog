import { NextResponse } from "next/server";
import { updateKeywordSchema } from "@/lib/schemas/keyword.schema";
import { keywordService } from "@/modules/keyword";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const keyword = await keywordService.findById(id);

    if (!keyword) {
      return NextResponse.json(
        { success: false, error: "키워드를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: keyword });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "키워드를 불러오지 못했습니다.";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
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

  const parsed = updateKeywordSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join("; ");
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json(
      { success: false, error: "수정할 항목이 없습니다." },
      { status: 400 },
    );
  }

  try {
    const existing = await keywordService.findById(id);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "키워드를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const keyword = await keywordService.update(id, parsed.data);

    return NextResponse.json({ success: true, data: keyword });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "키워드를 수정하지 못했습니다.";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const existing = await keywordService.findById(id);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "키워드를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    await keywordService.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "키워드를 삭제하지 못했습니다.";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
