import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiResponse } from "next";
import Pusher from "pusher";

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: any & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

/**
 * 🛰️ THE ANTIGRAVITY REAL-TIME DISPATCHER (SaaS PRODUCTION GRADE)
 * 
 * 1. PUSHER (PRIMARY): Stateless cloud relay for Vercel/Production deployment.
 * 2. SOCKET.IO (SECONDARY): Persistent singleton for local development.
 */

const getPusher = () => {
    // 🛡️ RECTIFICATION: Use PRIVATE keys in backend only.
    const appId = process.env.PUSHER_APP_ID;
    const key = process.env.PUSHER_KEY; // NO NEXT_PUBLIC_ FALLBACK HERE
    const secret = process.env.PUSHER_SECRET;
    const cluster = process.env.PUSHER_CLUSTER || "ap2";

    if (!appId || !key || !secret) {
        console.warn("🔥 REAL-TIME PAUSED: Backend Pusher Keys Missing! [Check Vercel ENV] 🛸");
        return null;
    }

    // In Serverless, we instantiate per-run or use a singleton if we trust the context.
    // The user suggested instantiating inside the request, so we'll do that via this helper.
    return new Pusher({ appId, key, secret, cluster, useTLS: true });
};

let globalIO: SocketIOServer | null = null;

export const initSocket = (res: NextApiResponseWithSocket) => {
  if (res.socket.server.io) {
    globalIO = res.socket.server.io;
    return res.socket.server.io;
  }
  const io = new SocketIOServer(res.socket.server as any, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: { origin: "*" }
  });
  res.socket.server.io = io;
  globalIO = io;
  return io;
};

/**
 * 🚀 UNIVERSAL DISPATCHER (ZERO-CONFIG SWITCH)
 * 
 * This broadcasts the 'matrix_update' heartbeat across the entire fleet.
 * When PUSHER_APP_ID is present, it uses Pusher (SaaS/Serverless Mode).
 * Otherwise, it falls back to Local Socket.io (Dev Mode).
 */
export const emitMatrixUpdate = async (payload: any = { timestamp: Date.now(), pulseType: "UI_REFETCH" }) => {
    const CHANNEL_NAME = "matrix-updates";
    const EVENT_NAME = "matrix_update";
    const isProd = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

    console.log(`🔥 [API DIAGNOSTIC] Shard Pulse: Triggered. (isProd=${isProd}) Payload:`, JSON.stringify(payload));

    // 🟠 MODE A: SaaS CLOUD RELAY (PUSHER)
    const p = getPusher();
    if (p) {
        try {
            console.log("🔥 PUSHER TRIGGER HO RAHA HAI");
            await p.trigger(CHANNEL_NAME, EVENT_NAME, { 
                ...payload,
                timestamp: payload.timestamp || Date.now()
            });
            console.log("🔥 PUSHER SENT SUCCESSFULLY! ✅");
        } catch (error: any) {
            console.error("❌ PUSHER ERROR:", error.message || error);
        }
    }

    // 🟡 MODE B: LOCAL BROADCAST (SOCKET.IO)
    if (globalIO && !isProd) {
        console.log(`🛰️ LOCAL DISPATCH -> [${EVENT_NAME}] via Socket Cluster ...`);
        globalIO.emit(EVENT_NAME, { 
            ...payload, 
            timestamp: payload.timestamp || Date.now() 
        });
    }

    if (!globalIO && !p) {
        console.warn("🛸 SHARD SILENT: No active Socket IO or Pusher Shard Detected!");
    }
};
