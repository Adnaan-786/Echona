import os
import re

files_to_rewrite = [
    "src/app/admin/page.tsx",
    "src/app/admin/competitions/page.tsx",
    "src/app/admin/competitions/new/page.tsx",
    "src/app/admin/competitions/[id]/page.tsx",
    "src/app/admin/competitions/[id]/leaderboard/page.tsx",
    "src/app/admin/competitions/[id]/rounds/new/page.tsx",
    "src/app/admin/rounds/[id]/page.tsx",
    "src/app/admin/rounds/[id]/questions/new/page.tsx",
    "src/app/competition/[id]/leaderboard/page.tsx"
]

def process_file(filepath):
    if not os.path.exists(filepath):
        print(f"Skipping {filepath}, does not exist")
        return

    with open(filepath, 'r') as f:
        content = f.read()

    # Add Spotlight import
    if 'Spotlight' not in content:
        content = content.replace('import Link from "next/link"', 'import Link from "next/link"\nimport { Spotlight } from "@/components/ui/spotlight"')

    # Replace root ocean-bg wrappers
    content = re.sub(
        r'<div[^>]*className="ocean-bg[^"]*"[^>]*>',
        '<div className="relative min-h-[calc(100vh-65px)] flex flex-col pt-32 pb-24 px-6 z-10 text-[#f4ede0]">',
        content
    )
    
    # Remove particle-field
    content = content.replace('<div className="particle-field" />', '')

    # Replace pirate-card instances with Spotlight wrappers
    # A standard pirate card looks like: <div className="pirate-card p-6 rounded-2xl">...</div>
    # We want to replace it with:
    # <div className="relative w-full overflow-hidden rounded-[2rem] bg-[#d4af37]/20 p-[2px] shadow-2xl">
    #   <Spotlight className="from-[#f4ede0] via-[#d4af37] to-transparent blur-3xl opacity-50" size={500} />
    #   <div className="relative w-full h-full rounded-[2rem] bg-[#1a1714]/80 backdrop-blur-md p-6 flex flex-col border border-[#d4af37]/10">
    
    # This is slightly risky with regex because of nested divs, so we'll just replace the exact class strings.
    content = content.replace('className="pirate-card', 'className="relative w-full overflow-hidden rounded-[2rem] bg-[#d4af37]/20 p-[1px] shadow-2xl group"><Spotlight className="from-[#f4ede0] via-[#d4af37] to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" size={400} /><div className="relative w-full h-full rounded-[2rem] bg-[#1a1714]/80 backdrop-blur-md border border-[#d4af37]/10')

    # Wait, the closing div for the pirate card needs an extra closing div because we added a wrapper!
    # Because of the complexity, maybe just replacing classes is safer:
    # content = content.replace('pirate-card', 'bg-[#1a1714]/80 backdrop-blur-md border border-[#d4af37]/20 rounded-2xl shadow-2xl')
    # Yes, just inline the glass CSS instead of full Spotlight wrapper for all nested admin cards to avoid unbalanced divs.
    
    # Let's revert the pirate-card replace and do a simpler CSS swap
    pass

def simpler_process_file(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r') as f:
        content = f.read()

    # Root background
    content = re.sub(
        r'<div[^>]*className="ocean-bg[^"]*"[^>]*>',
        '<div className="relative min-h-[calc(100vh-65px)] flex flex-col pt-32 pb-24 px-6 z-10 text-[#f4ede0]">',
        content
    )
    content = content.replace('<div className="particle-field" />', '')

    # Typography
    content = content.replace('font-mono', 'font-garamond')
    content = content.replace('text-[#fdf6e2]', 'text-[#f4ede0] font-cinzel tracking-wider')
    content = content.replace('text-[#f0e8d0]', 'text-[#f4ede0]')
    
    # Cards
    content = content.replace('pirate-card-corner', '')
    content = content.replace('pirate-card', 'bg-[#1a1714]/80 backdrop-blur-md border border-[#d4af37]/20 shadow-[0_0_15px_rgba(212,175,55,0.05)]')
    
    # Inputs
    content = content.replace('pirate-input', 'bg-[#1a1714]/60 border border-[#d4af37]/30 text-[#f4ede0] placeholder:text-[#f4ede0]/30 focus:outline-none focus:border-[#d4af37] transition-all')

    # Buttons
    content = content.replace('btn-pirate-gold', 'border border-[#d4af37]/40 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 font-cinzel font-bold tracking-widest text-[#d4af37] transition-all')
    content = content.replace('btn-pirate-crimson', 'border border-[#ef4444]/40 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 font-cinzel font-bold tracking-widest text-[#ef4444] transition-all')

    with open(filepath, 'w') as f:
        f.write(content)

for f in files_to_rewrite:
    simpler_process_file(f)

