"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"

export function DeleteButton({ action, id, label, confirmText }: { action: (id: string) => Promise<void>, id: string, label: string, confirmText: string }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (window.confirm(confirmText)) {
      startTransition(async () => {
        await action(id)
      })
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="rounded bg-[#8b0000]/80 px-3 py-1 text-xs font-bold text-white hover:bg-[#ff0000] disabled:opacity-50 transition-colors border border-[#ff0000]/30"
    >
      {isPending ? "DELETING..." : label}
    </button>
  )
}
