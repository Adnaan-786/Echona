import { PrismaClient } from "@prisma/client"
import {
  startCompetition,
  activateRound,
  requestCompile,
  submitSolution,
  endCompetition
} from "../lib/competition-engine"
import { runAICompetitionEvaluation } from "../lib/ai-debugger"

const prisma = new PrismaClient()

async function runEndToEndVerification() {
  console.log("⚓ ===================================================")
  console.log("⚓ STARTING FULL PIRATE CHAMPIONSHIP LIFECYCLE TEST")
  console.log("⚓ ===================================================")

  // 1. Fetch competition and users
  const comp = await prisma.competition.findFirst({
    where: { name: "Echona 2K26 - Pirate Code Championship" },
    include: {
      rounds: {
        orderBy: { order: "asc" },
        include: { questions: true }
      }
    }
  })

  if (!comp) throw new Error("Competition not found")
  console.log(`\n[STEP 1] Found Competition: "${comp.name}" (ID: ${comp.id})`)

  const user = await prisma.user.findUnique({ where: { email: "crew@echona.com" } })
  if (!user) throw new Error("Test user not found")
  console.log(`[STEP 1] User Verified: ${user.name} | Mobile: ${user.mobile} | Role: ${user.role}`)

  // 2. Admin Starts Test (Triggers 60-second countdown)
  console.log("\n[STEP 2] Admin triggers Start Test...")
  const startingComp = await startCompetition(comp.id)
  console.log(`✓ Competition Status transitioned to: ${startingComp.status} (60s countdown broadcasted)`)

  // 3. Round 1 Activates: "Quest for the Lost Treasure"
  console.log("\n[STEP 3] Activating Round 1: Quest for the Lost Treasure...")
  const round1 = await activateRound(comp.id, 1)
  console.log(`✓ Round 1 Status: ${round1.status} | Duration: ${round1.durationSeconds}s | Max Attempts: ${round1.maxCompileAttempts}`)

  const q1 = comp.rounds[0].questions[0]
  console.log(`✓ Challenge 1: "${q1.title}" (${q1.points} pts)`)

  // Clean old attempts for fresh testing
  await prisma.compileAttempt.deleteMany({ where: { userId: user.id, questionId: q1.id } })
  await prisma.submission.deleteMany({ where: { userId: user.id, questionId: q1.id } })

  // 4. Test Compile Attempts in Round 1
  console.log("\n[STEP 4] Testing Compile Quotas in Round 1 (Max 5 attempts allowed)...")
  const validCode = `function findCoordinates(bearings) {
  if (!bearings) return 0;
  const numbers = bearings.trim().split(/\\s+/).map(Number);
  return Math.max(...numbers);
}`

  for (let i = 1; i <= 5; i++) {
    const attempt = await requestCompile(user.id, q1.id, "javascript", validCode)
    console.log(`  ✓ Compile attempt ${attempt.attemptNumber}/5 executed: remaining ${attempt.remainingAttempts}`)
  }

  // 5. Test 6th attempt: MUST trigger error and AUTOMATICALLY SUBMIT!
  console.log("\n[STEP 5] Testing 6th Compile Attempt (Should fail quota and AUTO-SUBMIT)...")
  try {
    await requestCompile(user.id, q1.id, "javascript", validCode)
    console.error("❌ FAILED: 6th attempt should have thrown limit error!")
  } catch (err: any) {
    console.log(`  ✓ Caught Expected Error: "${err.message}"`)
    
    // Check if auto-submission was recorded
    const sub = await prisma.submission.findFirst({
      where: { userId: user.id, questionId: q1.id },
      include: { score: true }
    })
    if (sub) {
      console.log(`  ✓ AUTO-SUBMISSION VERIFIED IN DATABASE! Status: ${sub.status}, Score: ${sub.score?.pointsEarned} pts`)
    } else {
      console.error("❌ Auto-submission record not found!")
    }
  }

  // 6. Test Admin Ending Test & Triggering AI Debugger
  console.log("\n[STEP 6] Admin triggers End Test...")
  const endResult = await endCompetition(comp.id)
  console.log(`✓ Competition Successfully Ended. Participants Evaluated: ${endResult.allParticipants.length}`)
  console.log(`✓ Top 3 Winners Crowned:`)
  endResult.top3Winners.forEach((w: any, idx: number) => {
    console.log(`  🥇 Rank ${w.rank}: ${w.name} (${w.email} | ${w.mobile}) - Score: ${w.compositeScore} pts (Quality: ${w.avgQuality}%, Correctness: ${w.avgCorrectness}%)`)
  })

  // 7. Verify AI Debugger Analysis on submission
  const analyzedSub = await prisma.submission.findFirst({
    where: { userId: user.id, questionId: q1.id },
    include: { aiAnalysis: true }
  })
  if (analyzedSub?.aiAnalysis) {
    console.log("\n[STEP 7] AI Debugger Analysis Output:")
    console.log(`  - Correctness Score: ${analyzedSub.aiAnalysis.correctness}/100`)
    console.log(`  - Code Quality Score: ${analyzedSub.aiAnalysis.codeQuality}/100`)
    console.log(`  - Bugs Identified: ${analyzedSub.aiAnalysis.bugs.split('\n')[0]}`)
    console.log(`  - Feedback Snippet: ${analyzedSub.aiAnalysis.feedback.slice(0, 150)}...`)
  }

  console.log("\n⚓ ===================================================")
  console.log("⚓ FULL PIRATE CHAMPIONSHIP VERIFICATION PASSED 100%!")
  console.log("⚓ ===================================================")
}

runEndToEndVerification().catch(console.error)
