/**
 * Socket.IO client singleton.
 *
 * Connects to the same origin as the REST API (minus the /api path).
 * Sends the JWT token via the `auth.token` handshake so the backend
 * can authenticate the WebSocket connection.
 */

import { io, type Socket } from "socket.io-client"
import { getToken } from "./auth"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api"
// Socket.IO connects to the server root, not the /api prefix
const SOCKET_URL = BASE_URL.replace(/\/api\/?$/, "")

let socket: Socket | null = null

/**
 * Connect to the Socket.IO server with the current auth token.
 * Returns the socket instance. No-op if already connected.
 */
export function connectSocket(token?: string): Socket {
  if (socket?.connected) return socket

  const authToken = token ?? getToken()

  socket = io(SOCKET_URL, {
    auth: { token: authToken },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
  })

  socket.on("connect", () => {
    console.log("[Socket] Connected:", socket?.id)
  })

  socket.on("connect_error", (err) => {
    console.warn("[Socket] Connection error:", err.message)
  })

  socket.on("disconnect", (reason) => {
    console.log("[Socket] Disconnected:", reason)
  })

  return socket
}

/**
 * Disconnect and destroy the socket instance.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
    console.log("[Socket] Disconnected and cleaned up")
  }
}

/**
 * Get the current socket instance (may be null if not connected).
 */
export function getSocket(): Socket | null {
  return socket
}
