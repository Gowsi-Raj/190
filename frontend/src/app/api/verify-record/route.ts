import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hash = searchParams.get("hash") || "";
  const fir = searchParams.get("fir") || "";
  const badge = searchParams.get("badge") || "";

  if (!hash || hash.trim() === "") {
    return NextResponse.json({ 
      isAuthentic: false, 
      isTampered: true,
      reason: "NO_HASH_PROVIDED",
      message: "TAMPER ALERT: No SHA-256 cryptographic hash provided in QR code." 
    }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const queryParams = new URLSearchParams();
    queryParams.set("hash", hash.trim());
    if (fir && fir !== "N/A") queryParams.set("fir", fir.trim());
    if (badge && badge !== "N/A") queryParams.set("badge", badge.trim());

    const backendRes = await fetch(
      `http://127.0.0.1:8000/api/v1/documents/verify-record?${queryParams.toString()}`,
      { 
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!backendRes.ok) {
      const errData = await backendRes.json().catch(() => ({}));
      return NextResponse.json({
        isAuthentic: false,
        isTampered: true,
        reason: "DATABASE_RECORD_NOT_FOUND",
        message: errData.detail || "TAMPER ALERT: Record not found in official database ledger or was purged."
      });
    }

    const data = await backendRes.json();
    return NextResponse.json(data);

  } catch (err: any) {
    return NextResponse.json({
      isAuthentic: false,
      isTampered: true,
      reason: "CONNECTION_FAILED",
      message: "TAMPER CHECK OFFLINE: Unable to establish live connection to database ledger server."
    });
  }
}