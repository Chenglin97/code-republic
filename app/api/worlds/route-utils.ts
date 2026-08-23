import { NextResponse } from "next/server";
import { WorldRuleError } from "@/lib/world/actions";

export type WorldRouteContext = { params: Promise<{ worldId: string }> };

export async function getWorldId(context: WorldRouteContext): Promise<string> {
  return (await context.params).worldId;
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new WorldRuleError("INVALID_JSON", "The request body must be valid JSON.", 400);
  }
}

export function worldErrorResponse(error: unknown, fallbackMessage: string): NextResponse {
  if (error instanceof WorldRuleError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, ...error.details } },
      { status: error.status },
    );
  }
  console.error(fallbackMessage, error);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: fallbackMessage } },
    { status: 500 },
  );
}
