import { NextResponse } from "next/server";
import {
  createKeywordSchema,
  keywordListQuerySchema,
} from "@/lib/schemas/keyword.schema";
import { keywordService } from "@/modules/keyword";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = keywordListQuerySchema.safeParse({
      projectId: searchParams.get("projectId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      category: searchParams.get("category") ?? undefined,
    });

    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join("; ");
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    const keywords = await keywordService.findAll(parsed.data);

    return NextResponse.json({ success: true, data: keywords });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "키워드 목록을 불러오지 못했습니다.";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
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

  const parsed = createKeywordSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join("; ");
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  try {
    const keyword = await keywordService.create(parsed.data);

    return NextResponse.json({ success: true, data: keyword }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "키워드를 추가하지 못했습니다.";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
