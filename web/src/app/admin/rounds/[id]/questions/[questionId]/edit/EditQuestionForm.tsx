"use client"

import { useActionState } from "react"
import { updateQuestionWithStarterCodes } from "@/app/actions/admin"
import Link from "next/link"

export default function EditQuestionForm({ roundId, question }: { roundId: string, question: any }) {
  const [errorMessage, dispatch, isPending] = useActionState(
    async (prevState: string | undefined, formData: FormData) => {
      try {
        await updateQuestionWithStarterCodes(question.id, formData)
        return undefined
      } catch (e: any) {
        return e.message
      }
    },
    undefined
  )

  const jsStarter = question.starterCodes.find((s: any) => s.language === "javascript")?.code || ""
  const pyStarter = question.starterCodes.find((s: any) => s.language === "python")?.code || ""
  const cppStarter = question.starterCodes.find((s: any) => s.language === "cpp")?.code || ""

  const tc1 = question.testCases[0] || { input: "", expected: "" }
  const tc2 = question.testCases[1] || { input: "", expected: "" }
  const tc3 = question.testCases[2] || { input: "", expected: "" }

  return (
    <div className="min-h-[calc(100vh-65px)] bg-[#070b14] p-8 text-[#f4ede0] font-sans">
      <div className="mx-auto max-w-4xl bg-[#1a1714]/80 backdrop-blur-md border border-[#d4af37]/20 shadow-[0_0_15px_rgba(212,175,55,0.05)] rounded-2xl p-8 shadow-2xl">
        <div className="mb-6 border-b border-[#8b7355]/40 pb-4">
          <div className="inline-flex items-center space-x-2 rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-3 py-1 text-xs font-bold text-[#ffd700] mb-2">
            <span>📜</span>
            <span>EDIT ROUND QUESTION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-[#f4ede0] font-cinzel tracking-wider">
            MODIFY CODING CHALLENGE
          </h1>
        </div>

        <form action={dispatch} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#d4af37]" htmlFor="title">
                Problem Title
              </label>
              <input
                className="mt-1.5 block w-full rounded-lg border border-[#8b7355]/60 bg-[#0a0f1d] px-4 py-2.5 text-sm text-[#f4ede0] focus:border-[#ffd700] focus:outline-none"
                id="title"
                type="text"
                name="title"
                defaultValue={question.title}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#d4af37]" htmlFor="points">
                Bounty Points
              </label>
              <input
                className="mt-1.5 block w-full rounded-lg border border-[#8b7355]/60 bg-[#0a0f1d] px-4 py-2.5 text-sm text-[#f4ede0] focus:border-[#ffd700] focus:outline-none"
                id="points"
                type="number"
                name="points"
                defaultValue={question.points}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#d4af37]" htmlFor="description">
              Problem Description (Markdown)
            </label>
            <textarea
              className="mt-1.5 block w-full rounded-lg border border-[#8b7355]/60 bg-[#0a0f1d] p-4 text-xs font-garamond text-[#cbd5e1] focus:border-[#ffd700] focus:outline-none"
              id="description"
              name="description"
              rows={6}
              defaultValue={question.description}
              required
            />
          </div>

          <div className="border-t border-[#8b7355]/30 pt-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#ffd700] mb-4">
              ⚔️ Edit Starter Codes
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-garamond text-[#cbd5e1] mb-1">JavaScript:</label>
                <textarea className="w-full rounded-lg border border-[#8b7355]/40 bg-[#070b14] p-3 text-xs font-garamond text-[#cbd5e1] focus:border-[#ffd700] focus:outline-none" name="jsStarter" rows={4} defaultValue={jsStarter} />
              </div>
              <div>
                <label className="block text-xs font-garamond text-[#cbd5e1] mb-1">Python:</label>
                <textarea className="w-full rounded-lg border border-[#8b7355]/40 bg-[#070b14] p-3 text-xs font-garamond text-[#cbd5e1] focus:border-[#ffd700] focus:outline-none" name="pyStarter" rows={4} defaultValue={pyStarter} />
              </div>
              <div>
                <label className="block text-xs font-garamond text-[#cbd5e1] mb-1">C++:</label>
                <textarea className="w-full rounded-lg border border-[#8b7355]/40 bg-[#070b14] p-3 text-xs font-garamond text-[#cbd5e1] focus:border-[#ffd700] focus:outline-none" name="cppStarter" rows={4} defaultValue={cppStarter} />
              </div>
            </div>
          </div>

          <div className="border-t border-[#8b7355]/30 pt-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#ffd700] mb-4">
              🎯 Test Vectors (Public & Hidden)
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[#8b7355]/30 bg-[#070b14] p-4">
                <div className="text-xs font-bold text-[#ffd700] mb-2">Test Case 1 (Public):</div>
                <input type="text" name="testInput1" defaultValue={tc1.input} className="w-full rounded border border-[#8b7355]/40 bg-[#0a0f1d] px-3 py-1.5 text-xs text-[#cbd5e1] mb-2" placeholder="Input" />
                <input type="text" name="testExpected1" defaultValue={tc1.expected} className="w-full rounded border border-[#8b7355]/40 bg-[#0a0f1d] px-3 py-1.5 text-xs text-[#ffd700]" placeholder="Expected Output" />
              </div>
              <div className="rounded-xl border border-[#8b7355]/30 bg-[#070b14] p-4">
                <div className="text-xs font-bold text-[#ffd700] mb-2">Test Case 2 (Hidden):</div>
                <input type="text" name="testInput2" defaultValue={tc2.input} className="w-full rounded border border-[#8b7355]/40 bg-[#0a0f1d] px-3 py-1.5 text-xs text-[#cbd5e1] mb-2" placeholder="Input" />
                <input type="text" name="testExpected2" defaultValue={tc2.expected} className="w-full rounded border border-[#8b7355]/40 bg-[#0a0f1d] px-3 py-1.5 text-xs text-[#ffd700]" placeholder="Expected Output" />
              </div>
              <div className="rounded-xl border border-[#8b7355]/30 bg-[#070b14] p-4">
                <div className="text-xs font-bold text-[#ffd700] mb-2">Test Case 3 (Hidden):</div>
                <input type="text" name="testInput3" defaultValue={tc3.input} className="w-full rounded border border-[#8b7355]/40 bg-[#0a0f1d] px-3 py-1.5 text-xs text-[#cbd5e1] mb-2" placeholder="Input" />
                <input type="text" name="testExpected3" defaultValue={tc3.expected} className="w-full rounded border border-[#8b7355]/40 bg-[#0a0f1d] px-3 py-1.5 text-xs text-[#ffd700]" placeholder="Expected Output" />
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-[#ef4444] bg-[#450a0a] p-3 text-xs text-[#fca5a5]">
              ⚠️ {errorMessage}
            </div>
          )}

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-[#8b7355]/30">
            <Link
              href={`/admin/rounds/${roundId}`}
              className="text-xs font-bold text-[#cbd5e1] hover:text-[#ffd700] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="border border-[#d4af37]/40 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 font-cinzel font-bold tracking-widest text-[#d4af37] transition-all rounded-lg px-6 py-2.5 text-xs font-bold tracking-wider disabled:border-[#d4af37]/20 disabled:bg-[#d4af37]/5 disabled:text-[#d4af37]/80"
            >
              {isPending ? "SAVING..." : "SAVE CHANGES"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
