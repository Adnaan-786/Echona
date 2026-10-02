with open('src/lib/competition-engine.ts', 'r') as f:
    content = f.read()

import re

old_block = '''  // 4. Run AI Evaluation across all participants and compute Top 3 Winners
  const { allParticipants, top3Winners } = await runAICompetitionEvaluation(competitionId)

  // 5. Broadcast test_ended and ai_evaluation_completed with live podium data
  await broadcastEvent(competitionId, "test_ended", {
    competitionId,
    endedAt: new Date(),
    message: "The Captain has ended the test. All tests have been automatically submitted!",
    top3Winners
  })

  return {
    success: true,
    allParticipants,
    top3Winners
  }'''

new_block = '''  // 4. Broadcast test_ended immediately so clients are unblocked
  await broadcastEvent(competitionId, "test_ended", {
    competitionId,
    endedAt: new Date(),
    message: "The Captain has ended the test. All tests have been automatically submitted!"
  })

  // 5. Run AI Evaluation asynchronously in the background
  // This prevents the Next.js server action from timing out on large sets!
  runAICompetitionEvaluation(competitionId).then(async ({ allParticipants, top3Winners }) => {
    // Broadcast when evaluation is fully complete
    await broadcastEvent(competitionId, "ai_evaluation_completed", {
      competitionId,
      top3Winners
    })
  }).catch(e => {
    console.error("Background AI Evaluation failed:", e)
  })

  return {
    success: true,
    // Return empty placeholders to UI instantly; they will update via socket when AI finishes
    allParticipants: [],
    top3Winners: []
  }'''

content = content.replace(old_block, new_block)

with open('src/lib/competition-engine.ts', 'w') as f:
    f.write(content)
