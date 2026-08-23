import { getEventsAfter } from "@/lib/world/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const encoder = new TextEncoder();

function pause(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  let cursor = Math.max(0, Number.parseInt(url.searchParams.get("after") ?? "0", 10) || 0);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode("retry: 1500\n\n"));
      try {
        while (!request.signal.aborted) {
          const events = await getEventsAfter(cursor);
          for (const event of events) {
            controller.enqueue(
              encoder.encode(`id: ${event.version}\nevent: world.event\ndata: ${JSON.stringify(event)}\n\n`),
            );
            cursor = event.version;
          }
          if (events.length === 0) controller.enqueue(encoder.encode(": heartbeat\n\n"));
          await pause(900);
        }
      } catch (error) {
        if (!request.signal.aborted) console.error("World event stream failed", error);
      } finally {
        try {
          controller.close();
        } catch {
          // The browser may have already closed the stream.
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
