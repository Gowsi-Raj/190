import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hash = searchParams.get("hash") || "";

  if (!hash || hash.trim() === "") {
    return NextResponse.json({ 
      detail: "No SHA-256 cryptographic hash provided." 
    }, { status: 400 });
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ 
      detail: "AUTHENTICATION REQUIRED: Detailed forensic tampering report is classified under judicial privilege. Judicial Officer credentials required." 
    }, { status: 401 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const backendRes = await fetch(
      `http://127.0.0.1:8000/api/v1/documents/tamper-forensics?hash=${encodeURIComponent(hash.trim())}`,
      { 
        cache: "no-store",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": authHeader
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });

  } catch (err: any) {
    return NextResponse.json({
      detail: "Failed to connect to forensic backend service. Verify backend is running on port 8000."
    }, { status: 502 });
  }
}
