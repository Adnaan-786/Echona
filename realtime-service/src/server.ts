import express from "express"
import http from "http"
import { Server } from "socket.io"
import cors from "cors"

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "*", // In production, restrict this to the web app URL
    methods: ["GET", "POST"]
  }
})

// Internal secret to prevent unauthorized broadcasts
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "pirate-secret-key-123"

app.post("/broadcast", (req, res) => {
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${INTERNAL_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const { room, event, payload } = req.body
  if (!room || !event) {
    return res.status(400).json({ error: "Missing room or event" })
  }

  // Broadcast to all clients in the specified room
  io.to(room).emit(event, payload)
  
  console.log(`[Broadcast] Event '${event}' sent to room '${room}'`)
  return res.json({ success: true })
})

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`)

  socket.on("join_competition", (competitionId: string) => {
    socket.join(`competition_${competitionId}`)
    console.log(`Client ${socket.id} joined room: competition_${competitionId}`)
  })

  socket.on("leave_competition", (competitionId: string) => {
    socket.leave(`competition_${competitionId}`)
    console.log(`Client ${socket.id} left room: competition_${competitionId}`)
  })

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`)
  })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Real-Time Service running on port ${PORT}`)
})
