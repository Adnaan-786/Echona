import re

with open('src/app/competition/[id]/page.tsx', 'r') as f:
    content = f.read()

# Split the content at the start of the ACTIVE CODING ARENA return statement
parts = content.split('// ── STATE: ACTIVE CODING ARENA ────────────────────────────────')

new_ui = '''// ── STATE: ACTIVE CODING ARENA (Codédex-inspired Pirate Layout) ──
  return (
    <div className="flex h-[calc(100vh-65px)] w-full flex-col font-sans relative z-10 pt-4 pb-4 px-4 gap-4 text-[#f4ede0]">
      
      {/* ── MAIN IDE WORKSPACE ────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden w-full max-w-[1800px] mx-auto gap-4">
        
        {/* ── LEFT: Problem Panel (Exercise) ──────────────────────── */}
        <div className="relative w-[35%] xl:w-[30%] overflow-hidden rounded-2xl bg-[#d4af37]/10 p-[1px] shadow-2xl flex flex-col">
          <div className="relative flex-1 flex flex-col bg-[#1a1714]/70 backdrop-blur-lg rounded-2xl border border-[#d4af37]/20 overflow-hidden">
            {/* Header */}
            <div className="flex items-center px-5 py-4 border-b border-[#d4af37]/20 bg-[#d4af37]/5">
              <span className="text-[10px] font-cinzel font-bold uppercase tracking-[0.2em] text-[#d4af37]">Mission Briefing</span>
            </div>
            
            {currentQuestion ? (
              <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-[#d4af37]/30">
                <div className="mb-6">
                  <h2 className="text-3xl font-cinzel font-bold text-[#f4ede0] mb-2 leading-tight drop-shadow-md">
                    {String(selectedQuestionIndex + 1).padStart(2, '0')}. {currentQuestion.title}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="rounded bg-[#d4af37]/10 border border-[#d4af37]/30 px-2 py-0.5 text-xs font-bold font-garamond text-[#d4af37]">
                      {currentQuestion.points} BOUNTY PTS
                    </span>
                    {isQuestionSubmitted && (
                      <span className="rounded bg-emerald-900/40 border border-emerald-500/40 px-2 py-0.5 text-xs font-bold font-garamond text-emerald-400">
                        ✓ SUBMITTED
                      </span>
                    )}
                  </div>
                </div>

                <div className="prose prose-lg font-garamond max-w-none prose-p:text-[#f4ede0]/80 prose-headings:text-[#d4af37] prose-headings:font-cinzel prose-pre:bg-[#1a1714]/50 prose-pre:border prose-pre:border-[#d4af37]/20 prose-code:text-[#d4af37] leading-relaxed">
                  <ReactMarkdown>{currentQuestion.description}</ReactMarkdown>
                </div>

                {currentQuestion.testCases?.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-[#d4af37]/20">
                    <h4 className="text-[10px] font-cinzel font-bold uppercase tracking-[0.2em] text-[#d4af37] mb-4">
                      Test Vectors
                    </h4>
                    <div className="space-y-3">
                      {currentQuestion.testCases.map((tc, i) => (
                        <div key={i} className="rounded-xl p-4 text-sm font-mono bg-[#1a1714]/60 border border-[#d4af37]/10">
                          <div className="text-[#f4ede0]/50 mb-1">
                            Input: <span className="text-[#f4ede0]">{tc.input}</span>
                          </div>
                          <div className="text-[#f4ede0]/50">
                            Expected: <span className="text-[#d4af37]">{tc.expected}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#f4ede0]/50 font-garamond text-lg">
                No question selected.
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Editor & Terminal ───────────────────────────── */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          
          {/* EDITOR PANEL */}
          <div className="relative flex-[3] overflow-hidden rounded-2xl bg-[#d4af37]/10 p-[1px] shadow-2xl flex flex-col">
            <div className="relative flex-1 flex flex-col bg-[#1a1714]/70 backdrop-blur-lg rounded-2xl border border-[#d4af37]/20">
              
              {/* Editor Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#d4af37]/20 bg-[#d4af37]/5">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-transparent text-[#d4af37] text-xs font-cinzel font-bold uppercase tracking-wider outline-none cursor-pointer"
                  >
                    <option value="javascript" className="bg-[#1a1714]">JavaScript</option>
                    <option value="python" className="bg-[#1a1714]">Python 3</option>
                    <option value="cpp" className="bg-[#1a1714]">C++ 20</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" : "bg-red-500"}`} />
                  <span className="text-[10px] font-cinzel font-bold text-[#f4ede0]/50 uppercase tracking-widest hidden sm:block">
                    {connected ? "LIVE SYNC" : "OFFLINE"}
                  </span>
                </div>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1 relative">
                <Editor
                  height="100%"
                  theme="vs-dark"
                  language={language === "cpp" ? "cpp" : language}
                  value={currentCode}
                  onChange={handleCodeChange}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 15,
                    fontFamily: "'Fira Code', 'Courier New', monospace",
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    padding: { top: 20 },
                    fontLigatures: true,
                    overviewRulerBorder: false,
                    hideCursorInOverviewRuler: true,
                    renderLineHighlight: "none",
                  }}
                  className="bg-transparent"
                />
              </div>
              
            </div>
          </div>

          {/* TERMINAL PANEL */}
          <div className="relative flex-[1] min-h-[200px] overflow-hidden rounded-2xl bg-[#d4af37]/10 p-[1px] shadow-2xl flex flex-col">
            <div className="relative flex-1 flex flex-col bg-[#1a1714]/70 backdrop-blur-lg rounded-2xl border border-[#d4af37]/20">
              <div className="flex items-center justify-between px-5 py-2 border-b border-[#d4af37]/20 bg-[#d4af37]/5">
                <span className="text-[10px] font-cinzel font-bold uppercase tracking-[0.2em] text-[#f4ede0]/60">
                  Terminal
                </span>
                <button
                  onClick={() => setOutput("")}
                  className="text-[10px] font-cinzel font-bold uppercase tracking-widest text-[#d4af37] hover:text-[#f4ede0] transition-colors"
                >
                  Clear Output
                </button>
              </div>
              <pre className="flex-1 overflow-y-auto px-5 py-4 whitespace-pre-wrap font-mono text-sm text-[#f4ede0]/80 leading-relaxed scrollbar-thin scrollbar-thumb-[#d4af37]/30">
                {output || (
                  <div className="flex flex-col items-center justify-center h-full opacity-30 gap-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <polyline points="4 17 10 11 4 5"></polyline>
                      <line x1="12" y1="19" x2="20" y2="19"></line>
                    </svg>
                    <span className="font-garamond text-lg italic">Awaiting execution...</span>
                  </div>
                )}
              </pre>
            </div>
          </div>
          
        </div>
      </div>

      {/* ── BOTTOM NAV BAR (Footer) ────────────────────────────── */}
      <div className="flex-shrink-0 w-full max-w-[1800px] mx-auto h-16 rounded-2xl bg-[#1a1714]/80 backdrop-blur-lg border border-[#d4af37]/30 shadow-2xl flex items-center justify-between px-6">
        
        {/* Left: Questions Tabs */}
        <div className="flex items-center gap-2">
          <div className="mr-4 flex items-center gap-2 text-[#d4af37]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
            <span className="font-cinzel font-bold text-sm tracking-widest uppercase hidden sm:block">
              {round?.name || "The Trial"}
            </span>
          </div>
          <div className="h-6 w-[1px] bg-[#d4af37]/20 mr-4" />
          
          <div className="flex gap-2">
            {round?.questions.map((q, idx) => {
              const isSelected = idx === selectedQuestionIndex
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setSelectedQuestionIndex(idx)
                    setLanguage("javascript")
                    setOutput("")
                  }}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-cinzel font-bold transition-all ${
                    isSelected
                      ? "bg-[#d4af37] text-[#1a1714] shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                      : "bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/20"
                  }`}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-cinzel font-bold text-[#f4ede0]/50 tracking-widest mr-2 uppercase">
            Attempts: <span className={currentAttempts >= maxAttempts ? "text-red-500" : "text-[#d4af37]"}>{currentAttempts}/{maxAttempts}</span>
          </div>
          
          <button
            onClick={handleCompile}
            disabled={isCompiling || isSubmitting || currentAttempts >= maxAttempts}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/40 text-[#d4af37] font-cinzel font-bold text-xs tracking-widest uppercase hover:bg-[#d4af37]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isCompiling ? (
              <span className="w-3 h-3 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            )}
            Run Code
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={isCompiling || isSubmitting}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[#d4af37] text-[#1a1714] font-cinzel font-bold text-xs tracking-widest uppercase hover:bg-[#c8b887] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(212,175,55,0.4)]"
          >
            {isSubmitting ? (
              <span className="w-3 h-3 border-2 border-[#1a1714] border-t-transparent rounded-full animate-spin" />
            ) : null}
            Submit Answer
          </button>
        </div>
        
      </div>

      {/* ── ATTEMPT EXCEEDED MODAL ────────────────────────────── */}
      {attemptErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-red-500/20 p-[2px] shadow-2xl">
            <div className="relative w-full h-full rounded-[2rem] bg-[#1a1714]/90 backdrop-blur-md p-8 text-center border border-red-500/30 flex flex-col items-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" className="mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01"></path>
              </svg>
              <h3 className="text-xl font-cinzel font-bold text-red-400 tracking-wider">ATTEMPT LIMIT EXHAUSTED</h3>
              <p className="mt-3 text-sm font-garamond text-[#f4ede0]/70 leading-relaxed">{attemptErrorModal}</p>
              <button
                onClick={() => setAttemptErrorModal(null)}
                className="mt-6 w-full rounded-xl py-3 border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-cinzel font-bold tracking-widest uppercase transition-all"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
'''

content = parts[0] + new_ui

with open('src/app/competition/[id]/page.tsx', 'w') as f:
    f.write(content)
