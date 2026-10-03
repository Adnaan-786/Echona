import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export async function seedPirateChampionship() {
  console.log("⚓ Seeding Pirate Code Championship...")

  // 1. Create or ensure Admin & User accounts exist
  const hashedAdminPassword = await bcrypt.hash("admin123", 10)
  const hashedUserPassword = await bcrypt.hash("user123", 10)

  const admin = await prisma.user.upsert({
    where: { email: "captain@echona.com" },
    update: {
      name: "Captain Jack Sparrow",
      mobile: "+91 98765 43210",
      role: "ADMIN"
    },
    create: {
      email: "captain@echona.com",
      password: hashedAdminPassword,
      name: "Captain Jack Sparrow",
      mobile: "+91 98765 43210",
      role: "ADMIN"
    }
  })

  const user = await prisma.user.upsert({
    where: { email: "crew@echona.com" },
    update: {
      name: "Will Turner",
      mobile: "+91 87654 32109",
      role: "USER"
    },
    create: {
      email: "crew@echona.com",
      password: hashedUserPassword,
      name: "Will Turner",
      mobile: "+91 87654 32109",
      role: "USER"
    }
  })

  // 2. Find or create the flagship Championship
  let competition = await prisma.competition.findFirst({
    where: { name: "Echona 2K26 - Pirate Code Championship" },
    include: { rounds: true }
  })

  if (!competition) {
    competition = await prisma.competition.create({
      data: {
        name: "Echona 2K26 - Pirate Code Championship",
        description: "The premier algorithmic pirate tournament. 3 grueling trials of logic, strategy, and code mastery!",
        status: "WAITING",
      },
      include: { rounds: true }
    })
  } else {
    // Reset status to WAITING if seeding
    await prisma.competition.update({
      where: { id: competition.id },
      data: { status: "WAITING" }
    })

    // Wipe all previous participant attempts so they get a fresh start
    const rounds = await prisma.round.findMany({
      where: { competitionId: competition.id },
      select: { id: true, questions: { select: { id: true } } }
    })
    
    const questionIds = rounds.flatMap(r => r.questions.map(q => q.id))

    if (questionIds.length > 0) {
      await prisma.compileAttempt.deleteMany({ where: { questionId: { in: questionIds } } })
      await prisma.submission.deleteMany({ where: { questionId: { in: questionIds } } })
      await prisma.draftCode.deleteMany({ where: { questionId: { in: questionIds } } })
    }
    await prisma.competitionParticipant.deleteMany({ where: { competitionId: competition.id } })
  }

  // Ensure user is participant
  await prisma.competitionParticipant.upsert({
    where: {
      competitionId_userId: {
        competitionId: competition.id,
        userId: user.id
      }
    },
    update: {},
    create: {
      competitionId: competition.id,
      userId: user.id,
      score: 0
    }
  })

  // 3. Configure Round 1: Quest for the Lost Treasure
  // 3 questions, 25 minutes (1500s), 5 compile attempts
  let round1 = await prisma.round.findFirst({
    where: { competitionId: competition.id, order: 1 }
  })

  if (!round1) {
    round1 = await prisma.round.create({
      data: {
        competitionId: competition.id,
        name: "Quest for the Lost Treasure",
        order: 1,
        durationSeconds: 25 * 60, // 25 minutes
        maxCompileAttempts: 5,
        status: "PENDING"
      }
    })
  } else {
    await prisma.round.update({
      where: { id: round1.id },
      data: {
        name: "Quest for the Lost Treasure",
        durationSeconds: 25 * 60,
        maxCompileAttempts: 5,
        status: "PENDING"
      }
    })
  }

  // Round 1 - Question 1
  await createOrUpdateQuestion(round1.id, {
    title: "The Lost Island Coordinates",
    description: `### 🏴‍☠️ Mission Briefing
The navigator found an ancient maritime chart with coded bearing numbers. Write a function \`findCoordinates(bearings)\` that finds the single maximum peak coordinates representing the hidden treasure island.

### Input Format:
A single string of space-separated integers representing oceanic depths, e.g. \`"12 45 89 23 67"\`.

### Output Format:
The highest integer value found, or return \`0\` if empty.

### Example:
\`\`\`javascript
findCoordinates("12 45 89 23 67") // Output: 89
\`\`\`
`,
    points: 100,
    starterCodes: {
      javascript: `function findCoordinates(bearings) {
  if (!bearings || bearings.trim().length === 0) return 0;
  const numbers = bearings.trim().split(/\\s+/).map(Number);
  return Math.max(...numbers);
}
`,
      python: `def find_coordinates(bearings: str) -> int:
    if not bearings or not bearings.strip():
        return 0
    nums = [int(x) for x in bearings.split()]
    return max(nums)
`,
      cpp: `#include <iostream>
#include <sstream>
#include <algorithm>
#include <vector>

int findCoordinates(const std::string& bearings) {
    std::stringstream ss(bearings);
    int num, maxVal = 0;
    while (ss >> num) {
        maxVal = std::max(maxVal, num);
    }
    return maxVal;
}
`
    },
    testCases: [
      { input: "10 50 30", expected: "50", isHidden: false },
      { input: "100 200 50", expected: "200", isHidden: false },
      { input: "7 99 43 12", expected: "99", isHidden: true }
    ]
  })

  // Round 1 - Question 2
  await createOrUpdateQuestion(round1.id, {
    title: "Deciphering Blackbeard's Cipher",
    description: `### 🏴‍☠️ Mission Briefing
Blackbeard encrypted his orders by shifting every alphabetical character backward by 1 position (e.g., 'B' -> 'A', 'a' -> 'z', 'A' -> 'Z').
Write \`decipher(cipherText)\` to decode the pirate text!

### Input:
A string with encoded text.

### Output:
The decoded plaintext string.
`,
    points: 150,
    starterCodes: {
      javascript: `function decipher(cipherText) {
  return cipherText.split('').map(char => {
    if (/[a-z]/.test(char)) {
      return char === 'a' ? 'z' : String.fromCharCode(char.charCodeAt(0) - 1);
    }
    if (/[A-Z]/.test(char)) {
      return char === 'A' ? 'Z' : String.fromCharCode(char.charCodeAt(0) - 1);
    }
    return char;
  }).join('');
}
`,
      python: `def decipher(cipher_text: str) -> str:
    res = []
    for c in cipher_text:
        if 'a' <= c <= 'z':
            res.append('z' if c == 'a' else chr(ord(c) - 1))
        elif 'A' <= c <= 'Z':
            res.append('Z' if c == 'A' else chr(ord(c) - 1))
        else:
            res.append(c)
    return "".join(res)
`
    },
    testCases: [
      { input: "IFMMP", expected: "HELLO", isHidden: false },
      { input: "QJSBUF", expected: "PIRATE", isHidden: false },
      { input: "USFBTVSF", expected: "TREASURE", isHidden: true }
    ]
  })

  // Round 1 - Question 3
  await createOrUpdateQuestion(round1.id, {
    title: "Distribute the Cursed Doubloons",
    description: `### 🏴‍☠️ Mission Briefing
Captain Jack must split a chest containing $N$ golden doubloons equally among $K$ crew members. Any leftover doubloons are thrown into the ocean to appease Poseidon.
Write \`distributeDoubloons(input)\` where input is \`"N K"\` separated by a space.

### Output:
Return \`"Each: X, Sacrificed: Y"\`.
`,
    points: 200,
    starterCodes: {
      javascript: `function distributeDoubloons(input) {
  const [n, k] = input.split(' ').map(Number);
  if (k <= 0) return "Each: 0, Sacrificed: 0";
  const each = Math.floor(n / k);
  const sac = n % k;
  return \`Each: \${each}, Sacrificed: \${sac}\`;
}
`,
      python: `def distribute_doubloons(input_str: str) -> str:
    n, k = map(int, input_str.split())
    each = n // k
    sac = n % k
    return f"Each: {each}, Sacrificed: {sac}"
`
    },
    testCases: [
      { input: "100 3", expected: "Each: 33, Sacrificed: 1", isHidden: false },
      { input: "50 5", expected: "Each: 10, Sacrificed: 0", isHidden: false },
      { input: "77 4", expected: "Each: 19, Sacrificed: 1", isHidden: true }
    ]
  })

  // 4. Configure Round 2: The Kraken’s Trial
  // 2 questions, 20 minutes (1200s), 3 compile attempts
  let round2 = await prisma.round.findFirst({
    where: { competitionId: competition.id, order: 2 }
  })

  if (!round2) {
    round2 = await prisma.round.create({
      data: {
        competitionId: competition.id,
        name: "The Kraken’s Trial",
        order: 2,
        durationSeconds: 20 * 60, // 20 minutes
        maxCompileAttempts: 3,
        status: "PENDING"
      }
    })
  } else {
    await prisma.round.update({
      where: { id: round2.id },
      data: {
        name: "The Kraken’s Trial",
        durationSeconds: 20 * 60,
        maxCompileAttempts: 3,
        status: "PENDING"
      }
    })
  }

  // Round 2 - Question 1
  await createOrUpdateQuestion(round2.id, {
    title: "Escape the Kraken's Whirlpool",
    description: `### 🦑 The Trial of the Abyss
The Kraken has formed a whirlpool of radius $R$ nautical leagues. For every nautical league your vessel travels, it burns $F$ barrels of rum fuel. If fuel remaining drops below 0 before escaping, the ship sinks!
Write \`escapeWhirlpool(input)\` taking \`"Distance Fuel BurnRate"\`.
Return \`"ESCAPED with X fuel left"\` or \`"SUNKEN"\`.
`,
    points: 250,
    starterCodes: {
      javascript: `function escapeWhirlpool(input) {
  const [dist, fuel, burn] = input.split(' ').map(Number);
  const needed = dist * burn;
  if (fuel >= needed) {
    return \`ESCAPED with \${fuel - needed} fuel left\`;
  }
  return "SUNKEN";
}
`
    },
    testCases: [
      { input: "10 50 4", expected: "ESCAPED with 10 fuel left", isHidden: false },
      { input: "20 50 3", expected: "SUNKEN", isHidden: false },
      { input: "15 60 4", expected: "ESCAPED with 0 fuel left", isHidden: true }
    ]
  })

  // Round 2 - Question 2
  await createOrUpdateQuestion(round2.id, {
    title: "Targeting the Monster's Core",
    description: `### 🦑 Weak Points Calculation
Given an array of tentacle resistance values, calculate the sum of all prime values to strike the monster's vital core.
Write \`solve(input)\` where input is space-separated numbers.
`,
    points: 300,
    starterCodes: {
      javascript: `function solve(input) {
  function isPrime(num) {
    if (num <= 1) return false;
    for (let i = 2; i * i <= num; i++) {
      if (num % i === 0) return false;
    }
    return true;
  }
  const nums = input.trim().split(/\\s+/).map(Number);
  const sum = nums.filter(isPrime).reduce((a, b) => a + b, 0);
  return String(sum);
}
`
    },
    testCases: [
      { input: "2 3 4 5", expected: "10", isHidden: false },
      { input: "10 11 12 13", expected: "24", isHidden: false },
      { input: "1 4 6 8", expected: "0", isHidden: true }
    ]
  })

  // 5. Configure Round 3: Clash of the Captains
  // 1 question, 15 minutes (900s), 2 compile attempts
  let round3 = await prisma.round.findFirst({
    where: { competitionId: competition.id, order: 3 }
  })

  if (!round3) {
    round3 = await prisma.round.create({
      data: {
        competitionId: competition.id,
        name: "Clash of the Captains",
        order: 3,
        durationSeconds: 15 * 60, // 15 minutes
        maxCompileAttempts: 2,
        status: "PENDING"
      }
    })
  } else {
    await prisma.round.update({
      where: { id: round3.id },
      data: {
        name: "Clash of the Captains",
        durationSeconds: 15 * 60,
        maxCompileAttempts: 2,
        status: "PENDING"
      }
    })
  }

  // Round 3 - Question 1
  await createOrUpdateQuestion(round3.id, {
    title: "The Final Flagship Duel: Cannonball Trajectory",
    description: `### ⚔️ The Ultimate Showdown
Two colossal pirate flagships exchange broadside cannon fire.
Given an array of incoming cannonball trajectories with their velocities, find the maximum continuous subarray sum of impact forces using Kadane's algorithm.
Write \`solve(input)\` taking a space-separated sequence of integers (can include negative values).
`,
    points: 500,
    starterCodes: {
      javascript: `function solve(input) {
  const nums = input.trim().split(/\\s+/).map(Number);
  if (nums.length === 0) return "0";
  let maxSoFar = nums[0];
  let currMax = nums[0];
  for (let i = 1; i < nums.length; i++) {
    currMax = Math.max(nums[i], currMax + nums[i]);
    maxSoFar = Math.max(maxSoFar, currMax);
  }
  return String(maxSoFar);
}
`
    },
    testCases: [
      { input: "-2 1 -3 4 -1 2 1 -5 4", expected: "6", isHidden: false },
      { input: "1 2 3 4 5", expected: "15", isHidden: false },
      { input: "-1 -2 -3", expected: "-1", isHidden: true }
    ]
  })

  console.log("✅ Pirate Championship successfully seeded with all 3 rounds and questions!")
  return competition
}

async function createOrUpdateQuestion(
  roundId: string,
  data: {
    title: string
    description: string
    points: number
    starterCodes: Record<string, string>
    testCases: Array<{ input: string; expected: string; isHidden: boolean }>
  }
) {
  let q = await prisma.question.findFirst({
    where: { roundId, title: data.title }
  })

  if (!q) {
    q = await prisma.question.create({
      data: {
        roundId,
        title: data.title,
        description: data.description,
        points: data.points
      }
    })
  } else {
    await prisma.question.update({
      where: { id: q.id },
      data: {
        description: data.description,
        points: data.points
      }
    })
  }

  // Starter codes
  for (const [lang, code] of Object.entries(data.starterCodes)) {
    await prisma.starterCode.upsert({
      where: {
        questionId_language: {
          questionId: q.id,
          language: lang
        }
      },
      update: { code },
      create: {
        questionId: q.id,
        language: lang,
        code
      }
    })
  }

  // Test cases
  // Clear old and insert new
  await prisma.testCase.deleteMany({ where: { questionId: q.id } })
  for (const tc of data.testCases) {
    await prisma.testCase.create({
      data: {
        questionId: q.id,
        input: tc.input,
        expected: tc.expected,
        isHidden: tc.isHidden
      }
    })
  }
}
