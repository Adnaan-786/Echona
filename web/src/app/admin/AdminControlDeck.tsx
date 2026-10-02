"use client"

import { useState, useEffect } from "react"
import { useRealtime } from "@/hooks/useRealtime"
import {
  startTestAdmin,
  activateRoundAdmin,
  endTestAdmin,
  triggerSeedChampionship,
} from "@/app/actions/admin"
import Link from "next/link"

interface AdminDeckProps {
  initialData: any
}

export function AdminControlDeck({ initialData }: AdminDeckProps) {
  const [data, setData] = useState<any>(initialData)
  const competitionId = data?.competition?.id

  const { socket, connected } = useRealtime(competitionId || "")

  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [inspectedParticipant, setInspectedParticipant] = useState<any | null>(null)
  
  // Backend Timer display for Admin
  const [adminTimer, setAdminTimer] = useState<number>(data?.secondsRemaining || 0)

  // Listen to realtime socket events
  useEffect(() => {
    if (!socket) return

    socket.on("test_starting", () => {
      setData((prev: any) => prev ? {
        ...prev,
        competition: { ...prev.competition, status: "COUNTDOWN" }
      } : prev)
    })

    socket.on("round_started", (roundData: any) => {
      setAdminTimer(roundData.durationSeconds)
      setData((prev: any) => {
        if (!prev) return prev
        return {
          ...prev,
          competition: { ...prev.competition, status: "ACTIVE" },
          activeRound: {
            id: roundData.roundId,
            name: roundData.roundName,
            order: roundData.roundOrder,
            durationSeconds: roundData.durationSeconds,
            maxCompileAttempts: roundData.maxCompileAttempts
          }
        }
      })
    })

    socket.on("test_ended", (endData: any) => {
      setData((prev: any) => prev ? {
        ...prev,
        competition: { ...prev.competition, status: "ENDED" },
        evaluation: { top3Winners: endData.top3Winners }
      } : prev)
    })

    socket.on("leaderboard_updated", async () => {
      // Refresh admin data
      try {
        const res = await fetch(`/api/competition/${competitionId}/status`)
        const refreshed = await res.json()
        if (refreshed) {
          // fetch full admin data
        }
      } catch {}
    })

    return () => {
      socket.off("test_starting")
      socket.off("round_started")
      socket.off("test_ended")
      socket.off("leaderboard_updated")
    }
  }, [socket, competitionId])

  // Admin Countdown Timer tick
  useEffect(() => {
    if (data?.competition?.status !== "ACTIVE" || adminTimer <= 0) return

    const interval = setInterval(() => {
      setAdminTimer(prev => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [data?.competition?.status, adminTimer])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  // Handle Quick Seed
  const handleSeed = async () => {
    setLoadingAction("SEED")
    try {
      const res = await triggerSeedChampionship()
      if (res.success) {
        window.location.reload()
      }
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoadingAction(null)
    }
  }

  // Handle Start Test
  const handleStartTest = async () => {
    if (!competitionId) return
    setLoadingAction("START")
    try {
      await startTestAdmin(competitionId)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoadingAction(null)
    }
  }

  // Handle Activate Round
  const handleActivateRound = async (roundOrder: number) => {
    if (!competitionId) return
    setLoadingAction(`ROUND_${roundOrder}`)
    try {
      await activateRoundAdmin(competitionId, roundOrder)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoadingAction(null)
    }
  }

  // Handle End Test & Run AI Debugger
  const handleRestartTest = async () => {
    if (!competitionId) return
    if (!confirm("Are you sure you want to RESTART the test? This will reset the competition back to ACTIVE status!")) return

    setLoadingAction("RESTART")
    try {
      const res = await fetch(`/api/competition/${competitionId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" })
      })
      if (res.ok) {
        setData((prev: any) => ({
          ...prev,
          competition: { ...prev.competition, status: "ACTIVE" }
        }))
      }
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoadingAction(null)
    }
  }

  const handleEndTest = async () => {
    if (!competitionId) return
    if (!confirm("Are you sure you want to END the test? This will automatically submit all participants' codes and run the AI Debugging evaluation engine!")) return

    setLoadingAction("END")
    try {
      const res = await endTestAdmin(competitionId)
      if (res.success) {
        setData((prev: any) => ({
          ...prev,
          competition: { ...prev.competition, status: "ENDED" },
          evaluation: {
            top3Winners: res.top3Winners,
            allParticipants: res.allParticipants
          }
        }))
      }
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoadingAction(null)
    }
  }

  const comp = data?.competition
  const activeRound = data?.activeRound
  const participants = comp?.participants || []
  const top3Winners = data?.evaluation?.top3Winners || []
  const allEvaluated = data?.evaluation?.allParticipants || []

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-[#1a1714]/30 border border-[#d4af37]/20 rounded-2xl shadow-xl  rounded-2xl p-7 relative overflow-hidden">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[100px] opacity-[0.04] pointer-events-none select-none" aria-hidden="true">
          👑
        </div>
        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div>
            <div className="badge-gold mb-3">👑 CAPTAIN&apos;S COMMAND DECK</div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#f4ede0] font-cinzel tracking-wider mt-2"
              style={{ textShadow: "0 4px 20px rgba(0,0,0,0.8)" }}>
              <span className="text-shimmer">{comp?.name || "PIRATE CHAMPIONSHIP CONTROL"}</span>
            </h1>
            <p className="mt-2 text-sm text-[#4a5568]">
              Live command bridge for rounds, hidden backend timers, code uploads, and AI debugging engine.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSeed} disabled={loadingAction === "SEED"}
              className="btn-pirate-ghost rounded-xl px-4 py-2.5 text-sm disabled:opacity-50">
              {loadingAction === "SEED" ? "SEEDING..." : "⚓ RESET / SEED 3 ROUNDS"}
            </button>
            <Link href="/admin/competitions" className="btn-pirate-ghost rounded-xl px-4 py-2.5 text-sm">
              MANAGE VOYAGES
            </Link>
          </div>
        </div>
      </div>

      {/* Main Control Deck Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Competition Live Controls */}
        <div className="bg-[#1a1714]/30 border border-[#d4af37]/20 rounded-2xl shadow-xl lg:col-span-2 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#8b7355]/30 pb-4 mb-6">
            <div>
              <span className="text-sm font-garamond uppercase tracking-wider text-[#64748b]">STATUS</span>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className={`status-dot ${
                    comp?.status === "ACTIVE" ? "status-dot--live" :
                    comp?.status === "COUNTDOWN" ? "status-dot--warn" :
                    comp?.status === "ENDED" ? "status-dot--ended" : "status-dot--wait"
                  }`} />
                  <span className="text-base font-black text-[#d4af37] uppercase">
                    {comp?.status || "WAITING"}
                  </span>
                </div>
            </div>

            {/* Admin Backend Timer Display */}
            <div className="text-right">
              <span className="text-sm font-garamond uppercase tracking-wider text-[#64748b]">
                BACKEND TIMER (ADMIN ONLY)
              </span>
              <div className="font-garamond text-2xl font-black text-[#d4af37] drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]">
                {activeRound ? formatTime(adminTimer) : "--:--"}
              </div>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="space-y-4">
            <div className="text-sm font-bold uppercase tracking-wider text-[#d4af37]">
              Tournament Lifecycle Actions:
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {/* Button 1: Start/Restart Test */}
              {comp?.status === "ENDED" ? (
                <button
                  onClick={handleRestartTest}
                  disabled={loadingAction === "RESTART"}
                  className="border border-[#d4af37]/40 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 font-cinzel font-bold tracking-widest text-[#d4af37] transition-all rounded-xl p-4 text-left disabled:border-[#d4af37]/20 disabled:bg-[#d4af37]/5 disabled:text-[#d4af37]/80 shadow-lg"
                >
                  <div className="text-xl mb-1">🔄</div>
                  <div className="font-bold text-sm">RESTART TEST</div>
                  <div className="text-xs opacity-80 mt-0.5">Reset competition to ACTIVE status</div>
                </button>
              ) : (
                <button
                  onClick={handleStartTest}
                  disabled={loadingAction === "START" || comp?.status === "ACTIVE"}
                  className="border border-[#d4af37]/40 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 font-cinzel font-bold tracking-widest text-[#d4af37] transition-all rounded-xl p-4 text-left disabled:border-[#d4af37]/20 disabled:bg-[#d4af37]/5 disabled:text-[#d4af37]/80 shadow-lg"
                >
                  <div className="text-xl mb-1">⚔️</div>
                  <div className="font-bold text-sm">START TEST</div>
                  <div className="text-xs opacity-80 mt-0.5">Broadcasts 60s countdown to all sailors</div>
                </button>
              )}

              {/* Button 2: End Test */}
              <button
                onClick={handleEndTest}
                disabled={loadingAction === "END" || comp?.status === "ENDED"}
                className="border border-[#ef4444]/40 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 font-cinzel font-bold tracking-widest text-[#ef4444] transition-all rounded-xl p-4 text-left disabled:border-[#ef4444]/20 disabled:bg-[#ef4444]/5 disabled:text-[#ef4444]/80 transition-all shadow-lg"
              >
                <div className="text-xl mb-1">🛑</div>
                <div className="font-bold text-sm">END TEST & EVALUATE</div>
                <div className="text-xs opacity-80 mt-0.5">Auto-submits all codes & runs AI debugger</div>
              </button>

              {/* Link: Upload Questions & Codes */}
              <Link
                href={`/admin/competitions/${competitionId}`}
                className="rounded-xl border border-[#d4af37]/60 bg-[#d4af37]/10/70 p-4 text-left hover:bg-[#d4af37]/10 transition-all shadow-lg block"
              >
                <div className="text-xl mb-1">📜</div>
                <div className="font-bold text-sm text-[#d4af37]">UPLOAD CODES & QUESTIONS</div>
                <div className="text-xs text-[#f4ede0]/70 mt-0.5">Add custom questions round-wise</div>
              </Link>
            </div>

            {/* Quick Round Activator */}
            <div className="mt-6 border-t border-[#8b7355]/30 pt-4">
              <div className="text-sm font-bold uppercase tracking-wider text-[#d4af37] mb-3">
                Jump To Specific Round:
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  onClick={() => handleActivateRound(1)}
                  disabled={loadingAction === "ROUND_1"}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    activeRound?.order === 1
                      ? "border-[#ffd700] bg-[#ffd700]/10 text-[#d4af37]"
                      : "border-[#8b7355]/40 bg-transparent border-b border-[#d4af37]/20 text-[#f4ede0]/70 hover:border-[#ffd700]"
                  }`}
                >
                  <div className="font-bold text-sm">ROUND 1: Quest for Lost Treasure</div>
                  <div className="text-xs text-[#64748b] mt-1">3 Questions | 25 min | 5 attempts</div>
                </button>

                <button
                  onClick={() => handleActivateRound(2)}
                  disabled={loadingAction === "ROUND_2"}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    activeRound?.order === 2
                      ? "border-[#ffd700] bg-[#ffd700]/10 text-[#d4af37]"
                      : "border-[#8b7355]/40 bg-transparent border-b border-[#d4af37]/20 text-[#f4ede0]/70 hover:border-[#ffd700]"
                  }`}
                >
                  <div className="font-bold text-sm">ROUND 2: The Kraken's Trial</div>
                  <div className="text-xs text-[#64748b] mt-1">2 Questions | 20 min | 3 attempts</div>
                </button>

                <button
                  onClick={() => handleActivateRound(3)}
                  disabled={loadingAction === "ROUND_3"}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    activeRound?.order === 3
                      ? "border-[#ffd700] bg-[#ffd700]/10 text-[#d4af37]"
                      : "border-[#8b7355]/40 bg-transparent border-b border-[#d4af37]/20 text-[#f4ede0]/70 hover:border-[#ffd700]"
                  }`}
                >
                  <div className="font-bold text-sm">ROUND 3: Clash of Captains</div>
                  <div className="text-xs text-[#64748b] mt-1">1 Question | 15 min | 2 attempts</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Live Socket & Fleet Status */}
        <div className="bg-[#1a1714]/30 border border-[#d4af37]/20 rounded-2xl shadow-xl rounded-2xl p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#d4af37] mb-4">
            FLEET TELEMETRY
          </h3>

          <div className="space-y-4 text-sm font-garamond">
            <div className="flex justify-between border-b border-[#8b7355]/30 pb-2">
              <span className="text-[#64748b]">Socket Relay:</span>
              <span className={connected ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                {connected ? "🟢 BROADCAST ACTIVE" : "🔴 OFFLINE"}
              </span>
            </div>

            <div className="flex justify-between border-b border-[#8b7355]/30 pb-2">
              <span className="text-[#64748b]">Enrolled Sailors:</span>
              <span className="text-[#d4af37] font-bold">{participants.length} Participants</span>
            </div>

            <div className="flex justify-between border-b border-[#8b7355]/30 pb-2">
              <span className="text-[#64748b]">Current Active Stage:</span>
              <span className="text-[#f4ede0] font-cinzel tracking-wider font-bold">
                {activeRound ? `Round ${activeRound.order}` : "Awaiting Command"}
              </span>
            </div>

            <div className="flex justify-between border-b border-[#8b7355]/30 pb-2">
              <span className="text-[#64748b]">AI Debugger Status:</span>
              <span className="text-emerald-400 font-bold">
                {process.env.NEXT_PUBLIC_AI_MODE || "Groq LLM Ready"}
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-[#8b7355]/30 bg-transparent border border-[#d4af37]/20 p-4 text-sm text-[#f4ede0]/70 space-y-1">
            <div className="font-bold text-[#d4af37]">⚡ Real-Time Sync Rule:</div>
            <p>
              When you click &quot;Start Test&quot;, every sailor&apos;s screen triggers the 60-second countdown instantly. When you click &quot;End Test&quot;, all tests auto-submit and the AI evaluates everyone.
            </p>
          </div>
        </div>
      </div>

      {/* AI EVALUATION & TOP 3 WINNERS SHOWCASE */}
      {top3Winners.length > 0 && (
        <div className="bg-[#1a1714]/30 border border-[#d4af37]/20 rounded-2xl shadow-xl rounded-2xl p-8 border-2 border-[#ffd700] shadow-[0_0_40px_rgba(212,175,55,0.25)]">
          <div className="flex items-center space-x-3 mb-6">
            <span className="text-3xl">👑</span>
            <div>
              <h2 className="text-2xl font-black text-[#d4af37]">
                HIGH ADMIRAL AI VERDICT: TOP 3 WINNERS
              </h2>
              <p className="text-sm text-[#f4ede0]/70">
                Evaluated by Groq AI on Code Correctness, Efficiency, Structural Quality, and Algorithmic Complexity.
              </p>
            </div>
          </div>

          {/* Podium Grid */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {top3Winners.map((winner: any, idx: number) => (
              <div
                key={idx}
                className={`rounded-xl p-6 border text-left relative overflow-hidden transition-all ${
                  idx === 0
                    ? "border-[#ffd700] bg-gradient-to-b from-[#ffd700]/20 via-[#1e293b] to-[#0a0f1d] shadow-[0_0_30px_rgba(255,215,0,0.35)] scale-105"
                    : idx === 1
                    ? "border-[#94a3b8] bg-gradient-to-b from-[#94a3b8]/15 via-[#1e293b] to-[#0a0f1d]"
                    : "border-[#b45309] bg-gradient-to-b from-[#b45309]/15 via-[#1e293b] to-[#0a0f1d]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                  </span>
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-garamond font-bold uppercase tracking-wider border border-[#ffd700]/40 text-[#d4af37]">
                    RANK #{idx + 1}
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-black text-[#f4ede0] font-cinzel tracking-wider">{winner.name}</h3>
                <p className="text-sm font-garamond text-[#8b7355]">{winner.email}</p>
                {winner.mobile && (
                  <p className="text-sm font-garamond text-[#f4ede0]/70 mt-0.5">📞 {winner.mobile}</p>
                )}

                <div className="mt-5 space-y-1.5 border-t border-[#8b7355]/30 pt-3 text-sm font-garamond">
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Total Bounty Points:</span>
                    <span className="font-bold text-[#d4af37]">{winner.compositeScore} pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Test Vector Score:</span>
                    <span className="text-[#f4ede0]/70">{winner.testCasePoints} pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">AI Quality & Logic:</span>
                    <span className="text-emerald-400 font-bold">{winner.avgQuality}% / {winner.avgCorrectness}%</span>
                  </div>
                </div>

                <button
                  onClick={() => setInspectedParticipant(winner)}
                  className="border border-[#d4af37]/40 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 font-cinzel font-bold tracking-widest text-[#d4af37] transition-all mt-5 w-full rounded-lg py-2 text-sm font-bold"
                >
                  INSPECT AI CODE ANALYSIS &rarr;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Participants Roster */}
      <div className="bg-[#1a1714]/30 border border-[#d4af37]/20 rounded-2xl shadow-xl rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold uppercase tracking-wider text-[#d4af37]">
            ENROLLED FLEET (PARTICIPANTS)
          </h2>
          <span className="text-sm font-garamond text-[#64748b]">
            Total: {participants.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#8b7355]/40 bg-transparent border-b border-[#d4af37]/20 text-[#d4af37] font-garamond uppercase">
              <tr>
                <th className="px-4 py-3">Pirate Sailor</th>
                <th className="px-4 py-3">Contact Details</th>
                <th className="px-4 py-3">Bounty Score</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8b7355]/20">
              {participants.map((p: any) => {
                const evaluated = allEvaluated.find((e: any) => e.userId === p.userId)
                return (
                  <tr key={p.id} className="hover:bg-[#d4af37]/10/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-[#f4ede0] font-cinzel tracking-wider">
                      {p.user?.name || "Unknown Sailor"}
                      <div className="text-xs font-garamond text-[#64748b]">ID: {p.userId}</div>
                    </td>
                    <td className="px-4 py-3 font-garamond text-[#f4ede0]/70">
                      <div>{p.user?.email}</div>
                      <div className="text-[#d4af37]">📞 {p.user?.mobile || "No Mobile"}</div>
                    </td>
                    <td className="px-4 py-3 font-garamond font-bold text-[#d4af37]">
                      {evaluated ? `${evaluated.compositeScore} pts (AI: ${evaluated.avgQuality}%)` : `${p.score} pts`}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {evaluated ? (
                        <button
                          onClick={() => setInspectedParticipant(evaluated)}
                          className="rounded border border-[#ffd700]/50 bg-[#d4af37]/10 px-3 py-1 text-sm font-bold text-[#d4af37] hover:bg-[#ffd700]/20 transition-all"
                        >
                          View AI Debug Analysis
                        </button>
                      ) : (
                        <span className="text-[#64748b] text-sm">Pending AI Evaluation</span>
                      )}
                    </td>
                  </tr>
                )
              })}

              {participants.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[#64748b]">
                    No participants enrolled yet. Ask participants to sign up at /register!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Participant AI Debugging Modal */}
      {inspectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-[#1a1714]/30 border border-[#d4af37]/20 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] rounded-2xl p-6 border-2 border-[#ffd700] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-[#8b7355]/40 pb-3 mb-4">
              <div>
                <h3 className="text-xl font-black text-[#d4af37]">
                  AI CODE DEBUGGING REPORT
                </h3>
                <p className="text-sm text-[#f4ede0]/70">
                  Participant: <span className="font-bold text-[#f4ede0] font-cinzel tracking-wider">{inspectedParticipant.name}</span> ({inspectedParticipant.email} | {inspectedParticipant.mobile})
                </p>
              </div>
              <button
                onClick={() => setInspectedParticipant(null)}
                className="text-lg font-bold text-[#64748b] hover:text-white px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-[#8b7355]/30 bg-transparent border border-[#d4af37]/20 p-3 text-center">
                  <div className="text-xs text-[#64748b] uppercase">Correctness</div>
                  <div className="text-lg font-black text-emerald-400">{inspectedParticipant.avgCorrectness || 85}%</div>
                </div>
                <div className="rounded-lg border border-[#8b7355]/30 bg-transparent border border-[#d4af37]/20 p-3 text-center">
                  <div className="text-xs text-[#64748b] uppercase">Code Quality</div>
                  <div className="text-lg font-black text-[#d4af37]">{inspectedParticipant.avgQuality || 80}%</div>
                </div>
                <div className="rounded-lg border border-[#8b7355]/30 bg-transparent border border-[#d4af37]/20 p-3 text-center">
                  <div className="text-xs text-[#64748b] uppercase">Final Bounty</div>
                  <div className="text-lg font-black text-[#f4ede0] font-cinzel tracking-wider">{inspectedParticipant.compositeScore} pts</div>
                </div>
              </div>

              {/* Submissions breakdown */}
              {inspectedParticipant.submissions?.map((sub: any, idx: number) => (
                <div key={idx} className="rounded-xl border border-[#8b7355]/30 bg-transparent border-b border-[#d4af37]/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#d4af37] text-sm">
                      {sub.question?.title || `Challenge #${idx + 1}`}
                    </span>
                    <span className="rounded bg-emerald-950 px-2 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/40">
                      {sub.status}
                    </span>
                  </div>

                  {sub.aiAnalysis && (
                    <div className="space-y-2">
                      <div className="rounded border border-[#991b1b]/40 bg-[#450a0a]/30 p-3 text-sm font-garamond text-[#fca5a5]">
                        <div className="font-bold text-[#d4af37] mb-1">🐛 Identified Bugs & Warnings:</div>
                        <pre className="whitespace-pre-wrap">{sub.aiAnalysis.bugs}</pre>
                      </div>

                      <div className="rounded border border-[#8b7355]/30 bg-transparent border border-[#d4af37]/20 p-3 text-sm font-garamond text-[#f4ede0]/70">
                        <div className="font-bold text-[#d4af37] mb-1">📜 Admiral AI Feedback:</div>
                        <pre className="whitespace-pre-wrap">{sub.aiAnalysis.feedback}</pre>
                      </div>
                    </div>
                  )}

                  {/* Submitted Code Preview */}
                  <div>
                    <div className="text-sm font-garamond text-[#64748b] mb-1 uppercase">Submitted Code:</div>
                    <pre className="max-h-36 overflow-y-auto rounded border border-[#8b7355]/30 bg-transparent border border-[#d4af37]/20 p-3 text-sm font-garamond text-[#f4ede0]/70">
                      {sub.code}
                    </pre>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#8b7355]/40 text-right">
              <button
                onClick={() => setInspectedParticipant(null)}
                className="border border-[#d4af37]/40 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 font-cinzel font-bold tracking-widest text-[#d4af37] transition-all rounded-lg px-5 py-2 text-sm font-bold"
              >
                CLOSE REPORT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
