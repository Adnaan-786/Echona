const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function run() {
  const comps = await prisma.competition.findMany()
  console.log("Competitions:", comps.map(c => c.id))
}
run()
