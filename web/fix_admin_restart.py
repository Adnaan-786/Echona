with open('src/app/admin/AdminControlDeck.tsx', 'r') as f:
    content = f.read()

import re

# Add handleRestartTest function
handle_restart = '''  const handleRestartTest = async () => {
    if (!competitionId) return
    if (!confirm("Are you sure you want to RESTART the test? This will reset the competition back to ACTIVE status!")) return

    setLoadingAction("RESTART")
    try {
      const res = await fetch(`/api/competition/${competitionId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" })
      })
      if (res.ok) {
        setData((prev: any) => ({
          ...prev,
          competition: { ...prev.competition, status: "ACTIVE" }
        }))
      }
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoadingAction(null)
    }
  }

  const handleEndTest = async () => {'''

content = content.replace('  const handleEndTest = async () => {', handle_restart)

# Update buttons UI
old_buttons = '''              {/* Button 1: Start Test (Triggers 60s Countdown) */}
              <button
                onClick={handleStartTest}
                disabled={loadingAction === "START" || comp?.status === "ACTIVE" || comp?.status === "ENDED"}
                className="border border-[#d4af37]/40 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 font-cinzel font-bold tracking-widest text-[#d4af37] transition-all rounded-xl p-4 text-left disabled:opacity-30 transition-all shadow-lg"
              >
                <div className="text-xl mb-1">⚔️</div>
                <div className="font-bold text-sm">START TEST</div>
                <div className="text-xs opacity-80 mt-0.5">Broadcasts 60s countdown to all sailors</div>
              </button>'''

new_buttons = '''              {/* Button 1: Start/Restart Test */}
              {comp?.status === "ENDED" ? (
                <button
                  onClick={handleRestartTest}
                  disabled={loadingAction === "RESTART"}
                  className="border border-[#d4af37]/40 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 font-cinzel font-bold tracking-widest text-[#d4af37] transition-all rounded-xl p-4 text-left disabled:opacity-30 shadow-lg"
                >
                  <div className="text-xl mb-1">🔄</div>
                  <div className="font-bold text-sm">RESTART TEST</div>
                  <div className="text-xs opacity-80 mt-0.5">Reset competition to ACTIVE status</div>
                </button>
              ) : (
                <button
                  onClick={handleStartTest}
                  disabled={loadingAction === "START" || comp?.status === "ACTIVE"}
                  className="border border-[#d4af37]/40 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 font-cinzel font-bold tracking-widest text-[#d4af37] transition-all rounded-xl p-4 text-left disabled:opacity-30 shadow-lg"
                >
                  <div className="text-xl mb-1">⚔️</div>
                  <div className="font-bold text-sm">START TEST</div>
                  <div className="text-xs opacity-80 mt-0.5">Broadcasts 60s countdown to all sailors</div>
                </button>
              )}'''

content = content.replace(old_buttons, new_buttons)

with open('src/app/admin/AdminControlDeck.tsx', 'w') as f:
    f.write(content)
