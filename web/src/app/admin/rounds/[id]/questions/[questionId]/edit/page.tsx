import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
import { notFound } from "next/navigation"
import EditQuestionForm from "./EditQuestionForm"

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string; questionId: string }>
}) {
  const { id: roundId, questionId } = await params

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      starterCodes: true,
      testCases: true,
    }
  })

  if (!question) notFound()

  return <EditQuestionForm roundId={roundId} question={question} />
}
