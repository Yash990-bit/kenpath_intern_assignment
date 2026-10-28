import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getOrComputeAnalysis } from "@/lib/ai";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Explicitly verify session (do not rely on proxy/middleware alone)
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "अनधिकृत पहुँच (Unauthorized) - सत्र अमान्य है।" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const force = req.nextUrl.searchParams.get("force") === "true";
    const langParam = req.nextUrl.searchParams.get("lang");
    const lang: "hi" | "en" = langParam === "en" ? "en" : "hi";

    // 2. Fetch cached analysis or compute fresh if missing/forced
    const analysis = await getOrComputeAnalysis(id, force, lang);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("AI Analysis route error:", error);
    return NextResponse.json(
      { error: "विश्लेषण करने में त्रुटि हुई।" },
      { status: 500 }
    );
  }
}
