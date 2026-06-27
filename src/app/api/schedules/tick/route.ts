import { NextResponse } from "next/server";
import { executeDueSchedules } from "@/modules/scheduler";

export const runtime = "nodejs";
export const maxDuration = 300;

function isAuthorized(request: Request): boolean {
  const secret = process.env.SCHEDULER_SECRET?.trim();

  if (!secret) {
    return true;
  }

  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "스케줄러 인증에 실패했습니다." },
      { status: 401 },
    );
  }

  try {
    const result = await executeDueSchedules();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "예약 실행에 실패했습니다.";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
