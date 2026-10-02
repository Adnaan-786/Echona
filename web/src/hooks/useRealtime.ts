"use client"

import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"

// In production, this should be an absolute URL via env var
const REALTIME_SERVER_URL = process.env.NEXT_PUBLIC_REALTIME_URL || "http://localhost:3001"

export function useRealtime(competitionId: string) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!competitionId) return

    const newSocket = io(REALTIME_SERVER_URL)
    setSocket(newSocket)

    newSocket.on("connect", () => {
      setConnected(true)
      newSocket.emit("join_competition", competitionId)
    })

    newSocket.on("disconnect", () => {
      setConnected(false)
    })

    return () => {
      newSocket.emit("leave_competition", competitionId)
      newSocket.disconnect()
    }
  }, [competitionId])

  return { socket, connected }
}
