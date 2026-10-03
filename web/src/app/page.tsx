import { auth } from "@/auth"
import { VideoScrollSequence } from "@/components/VideoScrollSequence"
import { JoinJourneySection } from "@/components/JoinJourneySection"
import { LoadingIntro } from "@/components/LoadingIntro"

export default async function HomePage() {
  const session = await auth()

  return (
    <>
      <LoadingIntro />
      <VideoScrollSequence />
      <JoinJourneySection session={session} />
    </>
  )
}
