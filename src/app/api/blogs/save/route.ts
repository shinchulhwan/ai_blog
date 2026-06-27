import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { z } from "zod";
import { blogFullResponseSchema } from "@/lib/schemas/blog-response.schema";
import {
  buildBlogFilename,
  formatBlogMarkdown,
} from "@/lib/markdown/format-blog";

const saveRequestSchema = z.object({
  keyword: z.string().trim().min(1),
  blog: blogFullResponseSchema,
});

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

  const parsed = saveRequestSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join("; ");
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }

  try {
    const markdown = formatBlogMarkdown(parsed.data.blog);
    const filename = buildBlogFilename(parsed.data.keyword);
    const blogsDir = path.join(process.cwd(), "blogs");
    const filePath = path.join(blogsDir, filename);

    await mkdir(blogsDir, { recursive: true });
    await writeFile(filePath, markdown, "utf-8");

    return NextResponse.json({
      success: true,
      filename,
      path: `blogs/${filename}`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Markdown 파일 저장에 실패했습니다.";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
