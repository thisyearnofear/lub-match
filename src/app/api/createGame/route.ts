import { NextResponse } from "next/server";
import { uploadGame } from "@/utils/ipfs";

export const runtime = "nodejs"; // force Node, not edge

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const message = formData.get("message") as string | null;
    const storageMode = (formData.get("storageMode") as string) || "quick";
    const userApiKey = formData.get("userApiKey") as string | null;
    const pairs = formData.getAll("pairs") as File[];
    const reveal = formData.getAll("reveal") as File[];

    if (!message || !pairs || pairs.length !== 8) {
      return NextResponse.json(
        { error: "You must upload exactly 8 card images and a message." },
        { status: 400 },
      );
    }
    if (reveal && reveal.length > 36) {
      return NextResponse.json(
        { error: "You may upload up to 36 reveal images." },
        { status: 400 },
      );
    }
    if (storageMode === "private" && !userApiKey) {
      return NextResponse.json(
        { error: "API key required for private mode." },
        { status: 400 },
      );
    }

    // Only send reveal if at least 1 image is provided
    const revealList = reveal && reveal.length > 0 ? reveal : undefined;

    const result = await uploadGame(pairs, revealList, message, {
      mode: storageMode as "quick" | "private",
      apiKey: userApiKey || undefined,
    });

    return NextResponse.json({
      cid: result.cid,
      deletable: result.deletable,
      storageMode: result.storageMode,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Server error" },
      { status: 500 },
    );
  }
}
