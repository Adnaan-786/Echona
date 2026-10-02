"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";

export default function LeaderboardRefresher({ competitionId }: { competitionId: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!competitionId) return;

    const socketUrl = process.env.NEXT_PUBLIC_REALTIME_URL || "http://localhost:3001";
    const socket = io(socketUrl, { transports: ["websocket", "polling"] });

    socket.emit("join_competition", competitionId);

    socket.on("test_ended", () => {
      router.refresh();
    });

    return () => {
      socket.disconnect();
    };
  }, [competitionId, router]);

  return null;
}
