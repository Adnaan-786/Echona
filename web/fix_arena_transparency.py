with open('src/app/competition/[id]/page.tsx', 'r') as f:
    content = f.read()

# Make Left and Right columns transparent like the footer
content = content.replace('bg-[#1a1714]/80 backdrop-blur-md rounded-2xl', 'bg-[#1a1714]/25 backdrop-blur-md rounded-[2rem] p-4 border border-[#d4af37]/20')

# Change standard rounded-2xl to rounded-[2rem] for the Spotlight wrapper
content = content.replace('rounded-2xl bg-[#d4af37]/20 p-[1px]', 'rounded-[2rem] bg-[#d4af37]/20 p-[2px]')

# Fix internal dark background styling
content = content.replace('background: "rgba(8,14,28,0.98)"', 'background: "transparent"')
content = content.replace('background: "rgba(6,10,20,0.99)"', 'background: "transparent"')
content = content.replace('background: "rgba(5,8,15,0.8)"', 'background: "rgba(212,175,55,0.05)"')
content = content.replace('background: "rgba(5,8,15,0.9)"', 'background: "rgba(212,175,55,0.05)"')

# Make fonts bigger and use cinematic fonts
content = content.replace('text-xs', 'text-sm')
content = content.replace('text-[10px]', 'text-xs')
content = content.replace('text-[11px]', 'text-sm')

# Make Markdown text bigger and more beautiful
content = content.replace('prose-sm max-w-none prose-p:text-[#94a3b8] prose-headings:text-[#ffd700] prose-pre:bg-[rgba(5,8,15,0.9)] prose-pre:border prose-pre:border-[rgba(139,115,85,0.3)] prose-code:text-[#ffd700]', 'prose-lg font-garamond max-w-none prose-p:text-[#f4ede0]/80 prose-headings:text-[#d4af37] prose-headings:font-cinzel prose-pre:bg-[#1a1714]/50 prose-pre:border prose-pre:border-[#d4af37]/20 prose-code:text-[#d4af37]')

# Update border colors inside
content = content.replace('borderColor: "rgba(139,115,85,0.2)"', 'borderColor: "rgba(212,175,55,0.2)"')
content = content.replace('borderColor: "rgba(139,115,85,0.25)"', 'borderColor: "rgba(212,175,55,0.2)"')
content = content.replace('borderColor: "rgba(139,115,85,0.15)"', 'borderColor: "rgba(212,175,55,0.2)"')

# Make top header match (Wait, earlier I removed TOP HEADER... Oh wait, in the screenshot the top header is there!)
# If top header was removed, where is it coming from? Oh, the Navigation bar is in layout.tsx!
# Wait, in the screenshot, I see the Navigation bar (Home ... Captain Jack Sparrow) AND underneath it, the Q1 Q2 Q3 bar.
# Yes, the Q1 Q2 Q3 bar is what I styled.

with open('src/app/competition/[id]/page.tsx', 'w') as f:
    f.write(content)
