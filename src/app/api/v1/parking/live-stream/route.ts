import { NextRequest } from "next/server";
import { realtimeBus } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial handshake ping
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: "connected", time: new Date() })}\n\n`)
      );

      // Listen for parking events
      const unsubscribe = realtimeBus.subscribe((message: string) => {
        try {
          controller.enqueue(encoder.encode(message));
        } catch {
          unsubscribe();
        }
      });

      // Keep connection alive with heartbeat every 15s
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(interval);
          unsubscribe();
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // ignore already closed
        }
      });
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
