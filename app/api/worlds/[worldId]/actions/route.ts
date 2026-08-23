import { NextResponse } from "next/server";
import { WorldRuleError } from "@/lib/world/actions";
import { submitAction } from "@/lib/world/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    return NextResponse.json(await submitAction(await request.json()));
  } catch (error) {
    if (error instanceof WorldRuleError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    }
    console.error("Failed to submit World action", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "The World could not record this action." } },
      { status: 500 },
    );
  }
}
