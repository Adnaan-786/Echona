import { auth } from "@/auth"
import { VideoScrollSequence } from "@/components/VideoScrollSequence"
import { JoinJourneySection } from "@/components/JoinJourneySection"

export default async function HomePage() {
  const session = await auth()

  return (
    <>
      <VideoScrollSequence />
      <JoinJourneySection session={session} />
    </>
  )
}
