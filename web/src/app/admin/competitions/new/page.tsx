"use client"

import { useActionState } from "react"
import { createCompetition } from "@/app/actions/admin"
import Link from "next/link"

export default function NewCompetitionPage() {
  const [errorMessage, dispatch, isPending] = useActionState(
    async (prevState: string | undefined, formData: FormData) => {
      try {
        await createCompetition(formData)
        return undefined
      } catch (e: any) {
        return e.message
      }
    },
    undefined
  )

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-8 text-[#d4cbb3] font-sans">
      <div className="mx-auto max-w-2xl rounded-lg border-2 border-[#8b7355] bg-[#2a2a2a] p-8 shadow-2xl shadow-black">
        <div className="mb-8 border-b border-[#8b7355] pb-4">
          <h1 className="text-3xl font-bold tracking-widest text-[#d4af37]">NEW COMPETITION</h1>
        </div>

        <form action={dispatch} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#d4cbb3]" htmlFor="name">
              Competition Name
            </label>
            <input
              className="mt-1 block w-full rounded border border-[#8b7355] bg-[#1a1a1a] px-3 py-2 text-[#d4cbb3] focus:border-[#d4af37] focus:outline-none"
              id="name"
              type="text"
              name="name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#d4cbb3]" htmlFor="description">
              Description
            </label>
            <textarea
              className="mt-1 block w-full rounded border border-[#8b7355] bg-[#1a1a1a] px-3 py-2 text-[#d4cbb3] focus:border-[#d4af37] focus:outline-none"
              id="description"
              name="description"
              rows={4}
            />
          </div>

          {errorMessage && (
            <div className="rounded bg-[#4a0000] p-3 text-sm text-[#ff9999]">
              {errorMessage}
            </div>
          )}

          <div className="flex items-center justify-end space-x-4">
            <Link
              href="/admin/competitions"
              className="text-[#8b7355] hover:text-[#d4cbb3]"
            >
              Cancel
            </Link>
            <button
              className="rounded bg-[#8b0000] px-6 py-2 font-bold tracking-wide text-white transition-colors hover:bg-[#660000] disabled:bg-[#444]"
              disabled={isPending}
            >
              {isPending ? "CREATING..." : "CREATE"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
