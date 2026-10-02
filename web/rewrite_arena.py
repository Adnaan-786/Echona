import re

with open('src/app/competition/[id]/page.tsx', 'r') as f:
    content = f.read()

# Add Spotlight import
if 'Spotlight' not in content:
    content = content.replace('import Link from "next/link"', 'import Link from "next/link"\nimport { Spotlight } from "@/components/ui/spotlight"')

# Replace root wrapper (ocean-bg)
content = re.sub(
    r'<div\s+className="ocean-bg\s+flex\s+h-screen\s+flex-col\s+text-\[#f0e8d0\]"[^>]*>',
    '<div className="relative flex h-screen flex-col text-[#f4ede0] z-10 pt-[100px]">',
    content
)

# Remove particle-field
content = content.replace('<div className="particle-field" />', '')

# Remove Top Header (we have our own Navigation)
header_regex = re.compile(r'{/\*\s*── TOP HEADER ──\s*\*/}.*?(?={/\*\s*── MAIN BATTLEFIELD ──\s*\*/})', re.DOTALL)
content = re.sub(header_regex, '', content)

# Replace MAIN BATTLEFIELD wrapper
content = content.replace(
    '<div className="flex flex-1 overflow-hidden">',
    '<div className="flex flex-1 overflow-hidden max-w-[1600px] w-full mx-auto p-4 gap-4 pb-8">'
)

# Replace LEFT COLUMN wrapper
content = content.replace(
    '<div className="flex w-1/3 flex-col border-r" style={{ borderColor: "rgba(139,115,85,0.2)", background: "rgba(8,14,28,0.95)" }}>',
    '<div className="relative w-1/3 overflow-hidden rounded-2xl bg-[#d4af37]/20 p-[1px] shadow-2xl">\n          <Spotlight className="from-[#f4ede0] via-[#d4af37] to-transparent blur-3xl opacity-50" size={400} />\n          <div className="relative flex h-full flex-col bg-[#1a1714]/80 backdrop-blur-md rounded-2xl">'
)
# Close inner div for LEFT COLUMN
content = content.replace(
    'No question available.\n            </div>\n          )}',
    'No question available.\n            </div>\n          )}\n          </div>'
)

# Replace RIGHT COLUMN wrapper
content = content.replace(
    '<div className="flex w-2/3 flex-col bg-[#05080f]">',
    '<div className="relative w-2/3 overflow-hidden rounded-2xl bg-[#d4af37]/20 p-[1px] shadow-2xl">\n          <Spotlight className="from-[#f4ede0] via-[#d4af37] to-transparent blur-3xl opacity-50" size={400} />\n          <div className="relative flex h-full flex-col bg-[#1a1714]/80 backdrop-blur-md rounded-2xl">'
)
# Close inner div for RIGHT COLUMN
content = content.replace(
    '{output || "Awaiting your command, sailor..."}\n            </pre>\n          </div>',
    '{output || "Awaiting your command, sailor..."}\n            </pre>\n          </div>\n          </div>'
)

# Font updates
content = content.replace('font-mono', 'font-garamond')
content = content.replace('btn-pirate-gold', 'border border-[#d4af37]/40 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 font-cinzel tracking-widest text-[#d4af37]')
content = content.replace('btn-pirate-crimson', 'border border-[#ef4444]/40 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 font-cinzel tracking-widest text-[#ef4444]')

with open('src/app/competition/[id]/page.tsx', 'w') as f:
    f.write(content)
