import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const backendRes = await fetch(
      "http://127.0.0.1:8000/api/v1/auth/judicial-bench-auth",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });

  } catch (err: any) {
    return NextResponse.json({
      detail: "Failed to authenticate judicial bench. Ensure backend is running."
    }, { status: 502 });
  }
}
