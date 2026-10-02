import re

filepath = 'src/app/admin/AdminControlDeck.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Typography
content = content.replace('font-mono', 'font-garamond')
content = content.replace('text-[#fdf6e2]', 'text-[#f4ede0] font-cinzel tracking-wider')
content = content.replace('text-[#f0e8d0]', 'text-[#f4ede0]')
content = content.replace('text-[#ffd700]', 'text-[#d4af37]')
content = content.replace('text-[#cbd5e1]', 'text-[#f4ede0]/70')

# Cards
content = content.replace('pirate-card-corner', '')
content = content.replace('pirate-card', 'bg-[#1a1714]/80 backdrop-blur-md border border-[#d4af37]/20 shadow-[0_0_15px_rgba(212,175,55,0.05)]')

# Buttons
content = content.replace('btn-pirate-gold', 'border border-[#d4af37]/40 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 font-cinzel font-bold tracking-widest text-[#d4af37] transition-all')
content = content.replace('btn-pirate-crimson', 'border border-[#ef4444]/40 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 font-cinzel font-bold tracking-widest text-[#ef4444] transition-all')

# Inputs
content = content.replace('pirate-input', 'bg-[#1a1714]/60 border border-[#d4af37]/30 text-[#f4ede0] placeholder:text-[#f4ede0]/30 focus:outline-none focus:border-[#d4af37] transition-all')

with open(filepath, 'w') as f:
    f.write(content)
