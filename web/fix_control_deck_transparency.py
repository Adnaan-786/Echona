with open('src/app/admin/AdminControlDeck.tsx', 'r') as f:
    content = f.read()

# Make nested cards highly transparent
content = content.replace('bg-[#1a1714]/80 backdrop-blur-md border border-[#d4af37]/20 shadow-[0_0_15px_rgba(212,175,55,0.05)]', 'bg-[#1a1714]/30 border border-[#d4af37]/20 rounded-2xl shadow-xl')

# Make specific dark backgrounds transparent
content = content.replace('bg-[#070b14]', 'bg-transparent border border-[#d4af37]/20')
content = content.replace('bg-[#0a0f1d]', 'bg-transparent border-b border-[#d4af37]/20')
content = content.replace('bg-[#1e293b]', 'bg-[#d4af37]/10')
content = content.replace('bg-[#1e293b]/40', 'bg-[#d4af37]/10')

# Enhance font sizes and spacing
content = content.replace('text-xs', 'text-sm')
content = content.replace('text-[10px]', 'text-xs')
content = content.replace('text-[11px]', 'text-sm')

with open('src/app/admin/AdminControlDeck.tsx', 'w') as f:
    f.write(content)
