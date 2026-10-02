import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export interface AIAnalysisResult {
  correctness: number // 0 - 100
  codeQuality: number // 0 - 100
  efficiencyScore: number // 0 - 100
  bugs: string
  feedback: string
  status: "COMPLETED" | "FAILED"
}

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

// OpenRouter's built-in auto-router picks the best available free model.
// If the router itself is down, we cascade through these explicit fallbacks.
const FALLBACK_MODELS = [
  "openrouter/free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "nvidia/nemotron-3.5-lightning:free",
  "google/gemma-4-31b-it:free",
  "qwen/qwen3.8-27b:free",
  "cohere/north-mini-code:free",
]

/**
 * Calls OpenRouter using their native model routing.
 * - `route: "fallback"` tells OpenRouter to automatically try the next provider if one is down.
 * - `order: ["throughput"]` picks the provider with the highest available throughput.
 * - If the primary model fails entirely, we cascade to the next model in FALLBACK_MODELS.
 */
async function callOpenRouter(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<{ model: string; result: any } | null> {
  for (const model of FALLBACK_MODELS) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://echona2k26.local",
          "X-Title": "Echona 2K26 Pirate Code Championship",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
          // OpenRouter native routing: auto-retry across providers for this model
          route: "fallback",
          provider: {
            order: ["throughput"],
            allow_fallbacks: true,
          },
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        const errBody = await response.text().catch(() => "")
        console.warn(`[AI Debugger] ${model} returned ${response.status}: ${errBody.slice(0, 200)}`)
        continue // try next fallback model
      }

      const data = await response.json()
      const actualModel = data.model || model
      const rawContent = data.choices?.[0]?.message?.content
      if (!rawContent) {
        console.warn(`[AI Debugger] ${model} returned empty content`)
        continue
      }

      // Strip markdown code fences if the model wraps its JSON in them
      const cleaned = rawContent.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim()
      const parsed = JSON.parse(cleaned)

      if (typeof parsed.correctness !== "number" || typeof parsed.bugs !== "string") {
        console.warn(`[AI Debugger] ${model} returned malformed JSON, trying next...`)
        continue
      }

      console.log(`[AI Debugger] ✅ Routed via: ${actualModel}`)
      return { model: actualModel, result: parsed }
    } catch (err: any) {
      console.warn(`[AI Debugger] ${model} failed: ${err.message}`)
      continue
    }
  }

  console.error("[AI Debugger] All models exhausted — falling back to local engine")
  return null
}

/**
 * Fallback static analysis engine if no API key or all models fail
 */
function analyzeCodeLocally(
  code: string,
  language: string,
  questionTitle: string,
  questionDesc: string,
  executionPassed: boolean
): AIAnalysisResult {
  const lines = code.split("\n").filter(l => l.trim().length > 0)
  const lineCount = lines.length
  const hasComments = code.includes("//") || code.includes("/*") || code.includes("#")
  const hasLoops = /\b(for|while|forEach|map|filter|reduce)\b/.test(code)
  const hasRecursion = code.includes("function") && code.includes("(") // basic heuristic
  const hasEdgeCaseChecks = /\b(null|undefined|length\s*===?\s*0|<=?\s*0|!|empty)\b/.test(code)

  let codeQuality = 50
  if (hasComments) codeQuality += 15
  if (lineCount > 3 && lineCount < 100) codeQuality += 10
  if (hasEdgeCaseChecks) codeQuality += 10
  if (hasRecursion) codeQuality += 5

  const correctness = executionPassed ? 85 : 40
  const efficiencyScore = hasLoops ? 70 : 85

  const bugsList: string[] = []
  if (!hasEdgeCaseChecks) bugsList.push("⚠️ No edge-case handling detected for empty or null inputs")
  if (!hasComments) bugsList.push("⚠️ No comments found — code readability reduced for crew review")
  if (lineCount > 80) bugsList.push("⚠️ Code exceeds 80 lines — consider refactoring into smaller functions")
  if (!executionPassed) bugsList.push("🐛 CRITICAL: Code did not pass execution test cases — logic error likely")

  const greeting = executionPassed
    ? "☠️ Ahoy Captain! Yer code survived the kraken's gauntlet!"
    : "⚓ Avast! Yer code was dragged to Davy Jones' Locker by failing test cases."

  const feedback = `
${greeting}

### 🧭 Algorithmic Appraisal:
- **Language**: ${language.toUpperCase()}
- **Implementation Footprint**: ${lineCount} effective lines
- **Structural Integrity**: ${codeQuality >= 80 ? "Sturdy as the Black Pearl" : "Fair winds, but needs reinforcing against rogue waves"}

### ⚔️ Tactical Recommendations:
1. **Time Complexity**: ${hasLoops ? "O(N) to O(N log N) flow observed. Keep loops streamlined to avoid timeouts in the storm." : "Constant time or direct evaluation detected."}
2. **Robustness**: ${hasEdgeCaseChecks ? "Good defensive checks for boundary conditions." : "Bolster defensive checks for empty or null payloads to prevent shipwreck."}
3. **Purity**: Strive to minimize auxiliary space allocation during heavy computational surges.
`.trim()

  return {
    correctness,
    codeQuality,
    efficiencyScore,
    bugs: bugsList.join("\n"),
    feedback,
    status: "COMPLETED"
  }
}

/**
 * Primary AI code review and debugging function.
 * Races all free OpenRouter models and uses whichever responds first.
 */
export async function runAIDebugger(
  code: string,
  language: string,
  questionTitle: string,
  questionDesc: string,
  executionPassed: boolean
): Promise<AIAnalysisResult> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim()

  if (!apiKey) {
    return analyzeCodeLocally(code, language, questionTitle, questionDesc, executionPassed)
  }

  const systemPrompt = `You are the "High Admiral AI & Chief Pirate Code Debugger", an elite code evaluator in a competitive pirate-themed coding championship.
Analyze the user's submitted code against the problem statement.
You MUST output valid, raw JSON only (without markdown backticks) with the following structure:
{
  "correctness": <integer between 0 and 100>,
  "codeQuality": <integer between 0 and 100>,
  "efficiencyScore": <integer between 0 and 100>,
  "bugs": "<bulleted list of actual bugs, syntax warnings, edge cases, or potential failure points>",
  "feedback": "<detailed constructive pirate-themed review with performance, logic, and style advice>"
}`

  const userPrompt = `
Problem: ${questionTitle}
Description: ${questionDesc}
Language: ${language}
Execution Status: ${executionPassed ? "PASSED TEST CASES" : "FAILED OR INCOMPLETE TEST CASES"}

Submitted Code:
\`\`\`${language}
${code}
\`\`\`

Evaluate now and return strictly valid JSON matching the specified schema.
`

  try {
    const winner = await callOpenRouter(apiKey, systemPrompt, userPrompt)

    if (!winner) {
      console.warn("[AI Debugger] All models failed — falling back to local engine")
      return analyzeCodeLocally(code, language, questionTitle, questionDesc, executionPassed)
    }

    const parsed = winner.result
    return {
      correctness: Number(parsed.correctness) || 70,
      codeQuality: Number(parsed.codeQuality) || 70,
      efficiencyScore: Number(parsed.efficiencyScore) || 70,
      bugs: String(parsed.bugs || "No critical syntax bugs identified."),
      feedback: String(parsed.feedback || "Code reviewed successfully by High Admiral AI."),
      status: "COMPLETED"
    }
  } catch (error: any) {
    console.error("[AI Debugger Error - Falling back to local engine]:", error.message)
    return analyzeCodeLocally(code, language, questionTitle, questionDesc, executionPassed)
  }
}

/**
 * Analyzes a specific submission and records the AIAnalysis in the database
 */
export async function analyzeSubmission(submissionId: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      question: true,
      user: true,
      score: true
    }
  })

  if (!submission) throw new Error("Submission not found")

  const passed = submission.status === "ACCEPTED" || (submission.score?.pointsEarned ?? 0) > 0

  const result = await runAIDebugger(
    submission.code,
    submission.language,
    submission.question.title,
    submission.question.description,
    passed
  )

  const aiAnalysis = await prisma.aIAnalysis.upsert({
    where: { submissionId },
    create: {
      submissionId,
      correctness: result.correctness,
      codeQuality: result.codeQuality,
      bugs: result.bugs,
      feedback: result.feedback,
      status: result.status
    },
    update: {
      correctness: result.correctness,
      codeQuality: result.codeQuality,
      bugs: result.bugs,
      feedback: result.feedback,
      status: result.status
    }
  })

  return aiAnalysis
}

/**
 * Evaluates all submissions in a competition and calculates the Top 3 Winners
 */
export async function runAICompetitionEvaluation(competitionId: string) {
  const submissions = await prisma.submission.findMany({
    where: {
      question: {
        round: {
          competitionId
        }
      }
    },
    include: {
      question: true,
      user: true,
      score: true,
      aiAnalysis: true
    }
  })

  // Run AI analysis for any submission lacking analysis
  for (const sub of submissions) {
    if (!sub.aiAnalysis) {
      try {
        await analyzeSubmission(sub.id)
      } catch (err) {
        console.error(`Failed to analyze submission ${sub.id}:`, err)
      }
    }
  }

  // Refetch participants with their scores and submissions
  const participants = await prisma.competitionParticipant.findMany({
    where: { competitionId },
    include: {
      user: true,
      scores: true
    }
  })

  // Aggregate participant stats with AI scores
  const evaluatedParticipants = await Promise.all(
    participants.map(async (p) => {
      const userSubmissions = await prisma.submission.findMany({
        where: {
          userId: p.userId,
          question: {
            round: { competitionId }
          }
        },
        include: {
          question: {
            include: { round: true }
          },
          aiAnalysis: true,
          score: true
        }
      })

      const testCasePoints = p.scores.reduce((acc, s) => acc + s.pointsEarned, 0)
      
      // Calculate AI Quality & Correctness Bonus
      let totalAICorrectness = 0
      let totalAIQuality = 0
      const count = userSubmissions.length

      userSubmissions.forEach(sub => {
        if (sub.aiAnalysis) {
          totalAICorrectness += sub.aiAnalysis.correctness
          totalAIQuality += sub.aiAnalysis.codeQuality
        }
      })

      const avgCorrectness = count > 0 ? Math.round(totalAICorrectness / count) : 0
      const avgQuality = count > 0 ? Math.round(totalAIQuality / count) : 0
      
      // Composite Score: test points + (avgQuality * 0.5) + (avgCorrectness * 0.5)
      const compositeScore = testCasePoints + Math.round((avgCorrectness + avgQuality) / 2)

      return {
        participantId: p.id,
        userId: p.userId,
        name: p.user.name || p.user.email.split("@")[0],
        email: p.user.email,
        mobile: p.user.mobile || "N/A",
        testCasePoints,
        avgCorrectness,
        avgQuality,
        compositeScore,
        submissionsCount: count,
        submissions: userSubmissions
      }
    })
  )

  // Sort descending by composite score
  evaluatedParticipants.sort((a, b) => b.compositeScore - a.compositeScore)

  const top3Winners = evaluatedParticipants.slice(0, 3).map((winner, idx) => ({
    ...winner,
    rank: idx + 1,
    title: idx === 0 ? "Grand Admiral of the High Seas 👑" : idx === 1 ? "First Mate Commodore ⚔️" : "Master Gunner ⚓"
  }))

  return {
    allParticipants: evaluatedParticipants,
    top3Winners
  }
}
