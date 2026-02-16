import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = process.env.OPENCLAW_LOG_SECRET;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ success: true });
}
