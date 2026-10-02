const REALTIME_SERVICE_URL = process.env.REALTIME_SERVICE_URL || "http://localhost:3001"
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "pirate-secret-key-123"

export async function broadcastEvent(competitionId: string, event: string, payload: any) {
  try {
    const response = await fetch(`${REALTIME_SERVICE_URL}/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${INTERNAL_SECRET}`
      },
      body: JSON.stringify({
        room: `competition_${competitionId}`,
        event,
        payload
      })
    })

    if (!response.ok) {
      console.error(`[RealTime] Broadcast failed with status ${response.status}`)
    }
  } catch (error) {
    console.error(`[RealTime] Failed to connect to Real-Time service:`, error)
  }
}
