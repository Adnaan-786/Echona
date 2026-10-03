"use client"

import { use, useEffect, useState } from "react"
import { useRealtime } from "@/hooks/useRealtime"
import Editor from "@monaco-editor/react"
import ReactMarkdown from "react-markdown"
import { compileCode, submitFinalCode, saveDraft } from "@/app/actions/participant"
import Link from "next/link"
import { Spotlight } from "@/components/ui/spotlight"

interface QuestionData {
  id: string
  title: string
  description: string
  points: number
  starterCodes: Array<{ language: string; code: string }>
  testCases: Array<{ input: string; expected: string }>
}

interface RoundData {
  id: string
  name: string
  order: number
  maxCompileAttempts: number
  questions: QuestionData[]
}

export default function CompetitionArenaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: competitionId } = use(params)
  const { socket, connected } = useRealtime(competitionId)

  const [arenaState, setArenaState] = useState<"LOADING" | "WAITING" | "COUNTDOWN" | "SPLASH" | "ACTIVE" | "ENDED">("LOADING")
  const [competitionName, setCompetitionName] = useState("Echona 2K26 — Pirate Code Championship")
  const [countdownSeconds, setCountdownSeconds] = useState(60)
  const [splashRoundName, setSplashRoundName] = useState("Quest for the Lost Treasure")
  const [round, setRound] = useState<RoundData | null>(null)
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0)
  const [language, setLanguage] = useState("javascript")
  const [codes, setCodes] = useState<Record<string, string>>({})
  const [attempts, setAttempts] = useState<Record<string, number>>({})
  const [submissions, setSubmissions] = useState<Record<string, string>>({})
  const [output, setOutput] = useState<string>("")
  const [isCompiling, setIsCompiling] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attemptErrorModal, setAttemptErrorModal] = useState<string | null>(null)
  const [top3Winners, setTop3Winners] = useState<any[]>([])

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/competition/${competitionId}/status`)
      const data = await res.json()
      if (data.competitionName) setCompetitionName(data.competitionName)
      if (data.status === "WAITING" || data.status === "WAITING_ROUND") {
        setArenaState("WAITING")
      } else if (data.status === "COUNTDOWN") {
        setArenaState("COUNTDOWN")
        setCountdownSeconds(data.countdownSeconds || 60)
        setSplashRoundName(data.roundName || "Quest for the Lost Treasure")
      } else if (data.status === "ACTIVE_ROUND") {
        setRound(data.round)
        setArenaState("ACTIVE")
        if (data.userState) {
          setAttempts(data.userState.attempts || {})
          setSubmissions(data.userState.submissions || {})
          const newCodes: Record<string, string> = {}
          data.round.questions.forEach((q: QuestionData) => {
            const draft = data.userState.drafts?.[q.id]
            if (draft?.code) {
              newCodes[q.id] = draft.code
            } else {
              const starter = q.starterCodes.find((s) => s.language === "javascript") || q.starterCodes[0]
              newCodes[q.id] = starter?.code || `// Solution for ${q.title}\nfunction solve(input) {\n  return "";\n}\n`
            }
          })
          setCodes(newCodes)
        }
      } else if (data.status === "ENDED") {
        setArenaState("ENDED")
      }
    } catch {
      setArenaState("WAITING")
    }
  }

  useEffect(() => { fetchStatus() }, [competitionId])

  useEffect(() => {
    if (!socket) return
    socket.on("test_starting", (data: any) => {
      setArenaState("COUNTDOWN")
      setCountdownSeconds(data.countdownSeconds || 60)
      setSplashRoundName(data.roundName || "Quest for the Lost Treasure")
    })
    socket.on("round_started", (data: any) => {
      setSplashRoundName(data.roundName)
      setArenaState("SPLASH")
      setTimeout(() => {
        setRound({ id: data.roundId, name: data.roundName, order: data.roundOrder, maxCompileAttempts: data.maxCompileAttempts, questions: data.questions })
        const initialCodes: Record<string, string> = {}
        data.questions.forEach((q: QuestionData) => {
          const starter = q.starterCodes?.find((s) => s.language === "javascript") || q.starterCodes?.[0]
          initialCodes[q.id] = starter?.code || `// Solution for ${q.title}\nfunction solve(input) {\n  return "";\n}\n`
        })
        setCodes(initialCodes)
        setSelectedQuestionIndex(0)
        setArenaState("ACTIVE")
      }, 3000)
    })
    socket.on("attempt_exceeded", (data: any) => {
      setAttempts((prev) => ({ ...prev, [data.questionId]: data.maxAttempts }))
      setSubmissions((prev) => ({ ...prev, [data.questionId]: "AUTO_SUBMITTED" }))
    })
    socket.on("test_ended", (data: any) => {
      setArenaState("ENDED")
      if (data.top3Winners) setTop3Winners(data.top3Winners)
    })
    return () => {
      socket.off("test_starting")
      socket.off("round_started")
      socket.off("attempt_exceeded")
      socket.off("test_ended")
    }
  }, [socket])

  useEffect(() => {
    if (arenaState !== "COUNTDOWN") return
    if (countdownSeconds <= 0) { handleStartTestNow(); return }
    const interval = setInterval(() => setCountdownSeconds((prev) => prev - 1), 1000)
    return () => clearInterval(interval)
  }, [arenaState, countdownSeconds])

  const handleStartTestNow = () => {
    setArenaState("SPLASH")
    setTimeout(() => fetchStatus(), 2500)
  }

  const currentQuestion = round?.questions[selectedQuestionIndex]
  const currentCode = currentQuestion ? (codes[currentQuestion.id] || "") : ""
  const currentAttempts = currentQuestion ? (attempts[currentQuestion.id] || 0) : 0
  const maxAttempts = round?.maxCompileAttempts || 5
  const isQuestionSubmitted = currentQuestion && submissions[currentQuestion.id]
  const attemptsLeft = maxAttempts - currentAttempts

  const handleCodeChange = (newVal: string | undefined) => {
    if (!currentQuestion) return
    const updated = newVal || ""
    setCodes((prev) => ({ ...prev, [currentQuestion.id]: updated }))
    saveDraft(currentQuestion.id, language, updated).catch(() => {})
  }

  const handleCompile = async () => {
    if (!currentQuestion) return
    if (currentAttempts >= maxAttempts) {
      setAttemptErrorModal(`ATTEMPT LIMIT EXHAUSTED! You have consumed all ${maxAttempts}/${maxAttempts} compile attempts. Your code has been automatically locked and submitted!`)
      return
    }
    setIsCompiling(true)
    setOutput("⚔️ Hoisting sails — compiling in the Captain's workshop...\n")
    try {
      const res = await compileCode(currentQuestion.id, language, currentCode)
      setIsCompiling(false)
      if (res.success && res.attempt) {
        setAttempts((prev) => ({ ...prev, [currentQuestion.id]: res.attempt.attemptNumber }))
        setOutput(`[COMPILE ATTEMPT ${res.attempt.attemptNumber}/${res.attempt.maxAttempts}]\n\n${res.attempt.result}`)
      } else {
        setOutput(`[ERROR]\n${res.error}`)
        if (res.autoSubmitted) {
          setAttempts((prev) => ({ ...prev, [currentQuestion.id]: maxAttempts }))
          setSubmissions((prev) => ({ ...prev, [currentQuestion.id]: "AUTO_SUBMITTED" }))
          setAttemptErrorModal(res.error)
        }
      }
    } catch (err: any) {
      setIsCompiling(false)
      setOutput(`❌ NETWORK ERROR: Failed to run code. Please try again.\nDetails: ${err.message}`)
    }
  }

  const handleSubmit = async () => {
    if (!currentQuestion) return
    setIsSubmitting(true)
    setOutput("📜 Sealing your parchment — dispatching to the High Admiral's AI...\n")
    try {
      const res = await submitFinalCode(currentQuestion.id, language, currentCode)
      setIsSubmitting(false)
      if (res.success && res.submission) {
        setSubmissions((prev) => ({ ...prev, [currentQuestion.id]: res.submission.status }))
        setOutput(`✅ SUBMISSION RECORDED!\nStatus: ${res.submission.status}\nYour scroll has been received by the Admiral.`)
      } else {
        setOutput(`❌ SUBMISSION FAILED: ${res.error}`)
      }
    } catch (err: any) {
      setIsSubmitting(false)
      setOutput(`❌ NETWORK ERROR: Failed to reach the server. Please try again.\nDetails: ${err.message}`)
    }
  }

  // ── STATE: LOADING ────────────────────────────────────────────
  if (arenaState === "LOADING") {
    return (
      <div className="ocean-bg flex min-h-[calc(100vh-65px)] flex-col items-center justify-center">
        
        <div className="relative z-10 flex flex-col items-center gap-5">
          <div
            className="h-20 w-20 rounded-full animate-spin"
            style={{
              border: "3px solid transparent",
              borderTopColor: "#d4af37",
              borderRightColor: "rgba(212,175,55,0.4)",
              boxShadow: "0 0 30px rgba(212,175,55,0.3)",
            }}
          />
          <p className="font-garamond text-sm font-bold uppercase tracking-[0.2em] text-[#d4af37]">
            CHARTING THE SEAS...
          </p>
        </div>
      </div>
    )
  }

  // ── STATE: WAITING ────────────────────────────────────────────
  if (arenaState === "WAITING") {
    return (
      <div className="ocean-bg flex min-h-[calc(100vh-65px)] flex-col items-center justify-center p-6 text-center">
        
        <div className="relative z-10 w-full max-w-2xl animate-treasure-in">
          <div className="pirate-card pirate-card-corner rounded-2xl p-10 shadow-2xl">
            {/* Animated anchor */}
            <div
              className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl text-5xl animate-float"
              style={{
                background: "linear-gradient(135deg, #1e293b, #0a0f1d)",
                border: "2px solid rgba(212,175,55,0.5)",
                boxShadow: "0 0 40px rgba(212,175,55,0.2)",
              }}
            >
              ⚓
            </div>

            <div className="badge-gold badge-live mb-5">
              <span className="status-dot status-dot--live" />
              HARBOR WAITING ROOM
            </div>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#fdf6e2] mt-3"
              style={{ textShadow: "0 4px 24px rgba(0,0,0,0.8)" }}>
              WAITING FOR THE CAPTAIN
            </h1>
            <p className="mt-4 text-sm text-[#64748b] leading-relaxed max-w-lg mx-auto">
              The Admiral is reviewing maritime charts. As soon as the test begins, you will
              receive a 1-minute countdown to prepare your cannons!
            </p>

            {/* Rules scroll */}
            <div className="mt-8 rounded-xl border border-[rgba(139,115,85,0.25)] bg-[rgba(5,8,15,0.7)] p-5 text-left space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#d4af37] mb-3">
                📜 Standing Orders:
              </p>
              {[
                { icon: "🗺️", title: "Round 1", desc: "Quest for the Lost Treasure — 3 Questions | 5 Compile Attempts Max" },
                { icon: "🐙", title: "Round 2", desc: "The Kraken's Trial — 2 Questions | 3 Compile Attempts Max" },
                { icon: "💥", title: "Round 3", desc: "Clash of the Captains — 1 Question | 2 Compile Attempts Max" },
              ].map((r) => (
                <div key={r.title} className="flex items-start gap-3 text-sm font-garamond">
                  <span>{r.icon}</span>
                  <span>
                    <span className="text-[#f0e8d0] font-bold">{r.title}:</span>{" "}
                    <span className="text-[#64748b]">{r.desc}</span>
                  </span>
                </div>
              ))}
              <div className="flex items-start gap-3 text-sm font-garamond pt-2 border-t border-[rgba(139,115,85,0.2)]">
                <span>⚠️</span>
                <span className="text-amber-400 font-semibold">
                  Timers run strictly in the backend — NOT shown on your screen!
                </span>
              </div>
            </div>

            {/* Socket status */}
            <div className="mt-6 flex items-center justify-center gap-2 text-sm font-garamond text-[#2e3d5a]">
              <span className={`status-dot ${connected ? "status-dot--live" : "status-dot--danger"}`} />
              Live Flagship Socket:{" "}
              <span className={connected ? "text-emerald-400" : "text-red-400"}>
                {connected ? "Connected to Admiral" : "Connecting..."}
              </span>
            </div>
          </div>
        </div>

        {/* Wave decorations */}
        <div className="wave-layer wave-layer--1" aria-hidden="true">
          <svg viewBox="0 0 1440 160" preserveAspectRatio="none" fill="none">
            <path d="M0,80 C180,20 360,140 540,80 C720,20 900,140 1080,80 C1260,20 1440,100 1440,80 L1440,160 L0,160 Z" fill="rgba(20,60,120,0.4)" />
          </svg>
        </div>
      </div>
    )
  }

  // ── STATE: COUNTDOWN ──────────────────────────────────────────
  if (arenaState === "COUNTDOWN") {
    const isUrgent = countdownSeconds <= 10
    return (
      <div className="ocean-bg flex min-h-[calc(100vh-65px)] flex-col items-center justify-center p-6 text-center">
        

        {/* Central ambient orb */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)", animation: "orbPulse 3s ease-in-out infinite" }}
        />

        <div className="relative z-10 w-full max-w-xl animate-treasure-in">
          <div
            className="pirate-card pirate-card-corner rounded-2xl p-10 shadow-2xl"
            style={{ borderColor: isUrgent ? "rgba(239,68,68,0.6)" : "rgba(212,175,55,0.35)" }}
          >
            <div className="text-5xl mb-4 animate-float">⚔️</div>

            <div className="badge-crimson mb-4 animate-flicker">
              🔥 BATTLE COMMENCING
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-[#fdf6e2]"
              style={{ textShadow: "0 4px 20px rgba(0,0,0,0.9)" }}>
              PREPARE YE CANNONS!
            </h1>
            <p className="mt-2 text-sm text-[#64748b]">
              Next Voyage:{" "}
              <span className="font-bold text-[#ffd700]">{splashRoundName}</span>
            </p>

            {/* Big countdown ring */}
            <div className="my-8 flex justify-center">
              <div
                className="relative flex h-40 w-40 items-center justify-center rounded-full"
                style={{
                  background: "linear-gradient(135deg, #1e293b, #0a0f1d)",
                  border: `4px solid ${isUrgent ? "#ef4444" : "#ffd700"}`,
                  boxShadow: `0 0 ${isUrgent ? "50px rgba(239,68,68,0.6)" : "30px rgba(255,215,0,0.3)"}`,
                }}
              >
                <span
                  className="font-garamond text-6xl font-black leading-none"
                  style={{
                    color: isUrgent ? "#ef4444" : "#ffd700",
                    textShadow: `0 0 20px ${isUrgent ? "rgba(239,68,68,0.8)" : "rgba(255,215,0,0.6)"}`,
                    animation: isUrgent ? "urgentPulse 0.8s ease-in-out infinite" : undefined,
                  }}
                >
                  {countdownSeconds}
                </span>
                <span className="absolute bottom-5 font-garamond text-sm text-[#4a5568] tracking-wider">
                  SECONDS
                </span>
              </div>
            </div>

            <p className="text-sm text-[#64748b] mb-6">
              Click below to enter immediately, or the sails hoist automatically!
            </p>

            <button
              onClick={handleStartTestNow}
              className="border border-[#d4af37]/40 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 font-cinzel tracking-widest text-[#d4af37] w-full rounded-xl py-4 text-sm font-black tracking-widest"
            >
              ⚔️ START THE TEST NOW ⚔️
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── STATE: ROUND SPLASH ───────────────────────────────────────
  if (arenaState === "SPLASH") {
    return (
      <div className="round-splash">
        <div className="round-splash-orb" />
        <div className="relative z-10 flex flex-col items-center gap-6 animate-treasure-in">
          <div className="text-7xl animate-float">🏴‍☠️</div>
          <p className="font-garamond text-sm font-bold uppercase tracking-[0.25em] text-[#d4af37] opacity-70">
            ENTERING ARENA
          </p>
          <h1 className="text-4xl sm:text-6xl font-black tracking-wide text-shimmer px-6">
            {splashRoundName}
          </h1>
          <p className="text-sm font-garamond text-[#4a5568] mt-2">
            Hoisting code scrolls... May fortune favor your algorithms!
          </p>
          {/* Loading bar */}
          <div className="mt-4 w-64 h-0.5 bg-[#0a1224] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#d4af37] to-[#ffd700] rounded-full"
              style={{ animation: "scanLine 2.5s linear forwards", width: "100%" }}
            />
          </div>
        </div>
      </div>
    )
  }

  // ── STATE: ENDED ──────────────────────────────────────────────
  if (arenaState === "ENDED") {
    return (
      <div className="ocean-bg flex min-h-[calc(100vh-65px)] flex-col items-center justify-center p-6 text-center">
        
        <div className="relative z-10 w-full max-w-3xl animate-treasure-in">
          <div className="pirate-card pirate-card-corner rounded-2xl p-10 shadow-2xl">
            <div className="text-6xl mb-4 animate-float">🏆</div>
            <div className="badge-gold mb-4">TOURNAMENT CONCLUDED</div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#fdf6e2] mt-3"
              style={{ textShadow: "0 4px 20px rgba(0,0,0,0.8)" }}>
              ALL ANCHORS DROPPED
            </h1>
            <p className="mt-3 text-sm text-[#64748b] max-w-md mx-auto leading-relaxed">
              The Admiral has ended the test. All submissions have been evaluated by the High Admiral AI!
            </p>

            {top3Winners.length > 0 && (
              <div className="mt-10">
                <div className="rope-divider rope-divider-gold mb-6">
                  <span className="font-garamond text-sm font-bold uppercase tracking-widest text-[#d4af37]">
                    👑 TOP 3 CHAMPIONS
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {top3Winners.map((w, idx) => (
                    <div
                      key={idx}
                      className={`pirate-card rounded-xl p-5 text-left ${
                        idx === 0 ? "podium-1" : idx === 1 ? "podium-2" : "podium-3"
                      }`}
                    >
                      <div className="text-2xl font-black mb-2">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                      </div>
                      <div className="font-bold text-[#fdf6e2] text-sm">{w.name}</div>
                      <div className="text-xs font-garamond text-[#4a5568] mt-0.5">{w.email}</div>
                      <div className="mt-3 text-sm font-bold text-[#ffd700]">
                        {w.compositeScore} pts
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/standings"
                className="border border-[#d4af37]/40 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 font-cinzel tracking-widest text-[#d4af37] rounded-xl px-6 py-3 text-sm"
              >
                VIEW FULL BOUNTY BOARD
              </Link>
              <Link
                href="/dashboard"
                className="btn-pirate-ghost rounded-xl px-6 py-3 text-sm"
              >
                RETURN TO HARBOR
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── STATE: ACTIVE CODING ARENA (Codédex-inspired Pirate Layout) ──
  return (
    <div className="flex h-screen w-full flex-col font-sans relative z-10 pt-[120px] pb-4 px-4 gap-4 text-[#f4ede0]">
      
      {/* ── MAIN IDE WORKSPACE ────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden w-full max-w-[1800px] mx-auto gap-4">
        
        {/* ── LEFT: Problem Panel (Exercise) ──────────────────────── */}
        <div className="relative w-[35%] xl:w-[30%] overflow-hidden rounded-2xl bg-[#d4af37]/10 p-[1px] shadow-2xl flex flex-col">
          <div className="relative flex-1 flex flex-col bg-[#1a1714]/70 backdrop-blur-lg rounded-2xl border border-[#d4af37]/20 overflow-hidden">
            {/* Header */}
            <div className="flex items-center px-5 py-4 border-b border-[#d4af37]/20 bg-[#d4af37]/5">
              <span className="text-[10px] font-cinzel font-bold uppercase tracking-[0.2em] text-[#d4af37]">Mission Briefing</span>
            </div>
            
            {currentQuestion ? (
              <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-[#d4af37]/30">
                <div className="mb-6">
                  <h2 className="text-3xl font-cinzel font-bold text-[#f4ede0] mb-2 leading-tight drop-shadow-md">
                    {String(selectedQuestionIndex + 1).padStart(2, '0')}. {currentQuestion.title}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="rounded bg-[#d4af37]/10 border border-[#d4af37]/30 px-2 py-0.5 text-xs font-bold font-garamond text-[#d4af37]">
                      {currentQuestion.points} BOUNTY PTS
                    </span>
                    {isQuestionSubmitted && (
                      <span className="rounded bg-emerald-900/40 border border-emerald-500/40 px-2 py-0.5 text-xs font-bold font-garamond text-emerald-400">
                        ✓ SUBMITTED
                      </span>
                    )}
                  </div>
                </div>

                <div className="prose prose-lg font-garamond max-w-none prose-p:text-[#f4ede0]/80 prose-headings:text-[#d4af37] prose-headings:font-cinzel prose-pre:bg-[#1a1714]/50 prose-pre:border prose-pre:border-[#d4af37]/20 prose-code:text-[#d4af37] leading-relaxed">
                  <ReactMarkdown>{currentQuestion.description}</ReactMarkdown>
                </div>

                {currentQuestion.testCases?.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-[#d4af37]/20">
                    <h4 className="text-[10px] font-cinzel font-bold uppercase tracking-[0.2em] text-[#d4af37] mb-4">
                      Test Vectors
                    </h4>
                    <div className="space-y-3">
                      {currentQuestion.testCases.map((tc, i) => (
                        <div key={i} className="rounded-xl p-4 text-sm font-mono bg-[#1a1714]/60 border border-[#d4af37]/10">
                          <div className="text-[#f4ede0]/60 mb-1">
                            Input: <span className="text-[#f4ede0]">{tc.input}</span>
                          </div>
                          <div className="text-[#f4ede0]/60">
                            Expected: <span className="text-[#d4af37]">{tc.expected}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#f4ede0]/60 font-garamond text-lg">
                No question selected.
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Editor & Terminal ───────────────────────────── */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          
          {/* EDITOR PANEL */}
          <div className="relative flex-[3] overflow-hidden rounded-2xl bg-[#d4af37]/10 p-[1px] shadow-2xl flex flex-col">
            <div className="relative flex-1 flex flex-col bg-[#1a1714]/70 backdrop-blur-lg rounded-2xl border border-[#d4af37]/20">
              
              {/* Editor Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#d4af37]/20 bg-[#d4af37]/5">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-transparent text-[#d4af37] text-xs font-cinzel font-bold uppercase tracking-wider outline-none cursor-pointer"
                  >
                    <option value="javascript" className="bg-[#1a1714]">JavaScript</option>
                    <option value="python" className="bg-[#1a1714]">Python 3</option>
                    <option value="cpp" className="bg-[#1a1714]">C++ 20</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" : "bg-red-500"}`} />
                  <span className="text-[10px] font-cinzel font-bold text-[#f4ede0]/60 uppercase tracking-widest hidden sm:block">
                    {connected ? "LIVE SYNC" : "OFFLINE"}
                  </span>
                </div>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1 relative">
                <Editor
                  height="100%"
                  theme="vs-dark"
                  language={language === "cpp" ? "cpp" : language}
                  value={currentCode}
                  onChange={handleCodeChange}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 15,
                    fontFamily: "'Fira Code', 'Courier New', monospace",
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    padding: { top: 20 },
                    fontLigatures: true,
                    overviewRulerBorder: false,
                    hideCursorInOverviewRuler: true,
                    renderLineHighlight: "none",
                  }}
                  className="bg-transparent"
                />
              </div>
              
            </div>
          </div>

          {/* TERMINAL PANEL */}
          <div className="relative flex-[1] min-h-[200px] overflow-hidden rounded-2xl bg-[#d4af37]/10 p-[1px] shadow-2xl flex flex-col">
            <div className="relative flex-1 flex flex-col bg-[#1a1714]/70 backdrop-blur-lg rounded-2xl border border-[#d4af37]/20">
              <div className="flex items-center justify-between px-5 py-2 border-b border-[#d4af37]/20 bg-[#d4af37]/5">
                <span className="text-[10px] font-cinzel font-bold uppercase tracking-[0.2em] text-[#f4ede0]/60">
                  Terminal
                </span>
                <button
                  onClick={() => setOutput("")}
                  className="text-[10px] font-cinzel font-bold uppercase tracking-widest text-[#d4af37] hover:text-[#f4ede0] transition-colors"
                >
                  Clear Output
                </button>
              </div>
              <pre className="flex-1 overflow-y-auto px-5 py-4 whitespace-pre-wrap font-mono text-sm text-[#f4ede0]/80 leading-relaxed scrollbar-thin scrollbar-thumb-[#d4af37]/30">
                {output || (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-[#f4ede0]/60">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-50">
                      <polyline points="4 17 10 11 4 5"></polyline>
                      <line x1="12" y1="19" x2="20" y2="19"></line>
                    </svg>
                    <span className="font-garamond text-lg italic">Awaiting execution...</span>
                  </div>
                )}
              </pre>
            </div>
          </div>
          
        </div>
      </div>

      {/* ── BOTTOM NAV BAR (Footer) ────────────────────────────── */}
      <div className="flex-shrink-0 w-full max-w-[1800px] mx-auto h-16 rounded-2xl bg-[#1a1714]/80 backdrop-blur-lg border border-[#d4af37]/30 shadow-2xl flex items-center justify-between px-6">
        
        {/* Left: Questions Tabs */}
        <div className="flex items-center gap-2">
          <div className="mr-4 flex items-center gap-2 text-[#d4af37]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
            <span className="font-cinzel font-bold text-sm tracking-widest uppercase hidden sm:block">
              {round?.name || "The Trial"}
            </span>
          </div>
          <div className="h-6 w-[1px] bg-[#d4af37]/20 mr-4" />
          
          <div className="flex gap-2">
            {round?.questions.map((q, idx) => {
              const isSelected = idx === selectedQuestionIndex
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setSelectedQuestionIndex(idx)
                    setLanguage("javascript")
                    setOutput("")
                  }}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-cinzel font-bold transition-all ${
                    isSelected
                      ? "bg-[#d4af37] text-[#1a1714] shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                      : "bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/20"
                  }`}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-cinzel font-bold text-[#f4ede0]/60 tracking-widest mr-2 uppercase">
            Attempts: <span className={currentAttempts >= maxAttempts ? "text-red-500" : "text-[#d4af37]"}>{currentAttempts}/{maxAttempts}</span>
          </div>
          
          <button
            onClick={handleCompile}
            disabled={isCompiling || isSubmitting || currentAttempts >= maxAttempts}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/40 text-[#d4af37] font-cinzel font-bold text-xs tracking-widest uppercase hover:bg-[#d4af37]/20 transition-all disabled:border-[#d4af37]/20 disabled:bg-[#d4af37]/5 disabled:text-[#d4af37]/80 disabled:cursor-not-allowed"
          >
            {isCompiling ? (
              <span className="w-3 h-3 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            )}
            Run Code
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={isCompiling || isSubmitting}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[#d4af37] text-[#1a1714] font-cinzel font-bold text-xs tracking-widest uppercase hover:bg-[#c8b887] transition-all disabled:bg-[#d4af37]/80 disabled:text-[#1a1714]/80 disabled:shadow-none disabled:cursor-not-allowed shadow-[0_0_15px_rgba(212,175,55,0.4)]"
          >
            {isSubmitting ? (
              <span className="w-3 h-3 border-2 border-[#1a1714] border-t-transparent rounded-full animate-spin" />
            ) : null}
            Submit Answer
          </button>
        </div>
        
      </div>

      {/* ── ATTEMPT EXCEEDED MODAL ────────────────────────────── */}
      {attemptErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-red-500/20 p-[2px] shadow-2xl">
            <div className="relative w-full h-full rounded-[2rem] bg-[#1a1714]/90 backdrop-blur-md p-8 text-center border border-red-500/30 flex flex-col items-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" className="mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01"></path>
              </svg>
              <h3 className="text-xl font-cinzel font-bold text-red-400 tracking-wider">ATTEMPT LIMIT EXHAUSTED</h3>
              <p className="mt-3 text-sm font-garamond text-[#f4ede0]/70 leading-relaxed">{attemptErrorModal}</p>
              <button
                onClick={() => setAttemptErrorModal(null)}
                className="mt-6 w-full rounded-xl py-3 border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-cinzel font-bold tracking-widest uppercase transition-all"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
