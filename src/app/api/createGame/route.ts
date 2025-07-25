import { NextResponse } from "next/server";
// import { unstable_allowDynamic } from "next/dynamic";
import { uploadGame } from "@/utils/ipfs";

// unstable_allowDynamic(() => import("web3.storage"), ["web3.storage"]);

export const runtime = "nodejs"; // force Node, not edge

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const message = formData.get("message") as string | null;
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
    // Only send reveal if at least 1 image is provided
    const revealList = reveal && reveal.length > 0 ? reveal : undefined;

    const cid = await uploadGame(pairs, revealList, message);
    return NextResponse.json({ cid });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Server error" },
      { status: 500 },
    );
  }
}
