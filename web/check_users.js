const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function run() {
  const users = await prisma.user.findMany()
  console.log("Users:", users.map(u => ({ id: u.id, email: u.email })))
}
run()
