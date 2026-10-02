import re

with open('src/app/competition/[id]/page.tsx', 'r') as f:
    content = f.read()

# Fix the extra closing div in the left column
content = content.replace(
    'No question available.\n            </div>\n          )}\n          </div>\n        </div>',
    'No question available.\n            </div>\n          )}\n        </div>'
)

# And actually apply the Spotlight wrapper to the Left Column properly!
left_col_old = '''        <div
          className="flex w-1/3 flex-col"
          style={{ background: "rgba(8,14,28,0.97)", borderRight: "1px solid rgba(139,115,85,0.25)" }}
        >'''

left_col_new = '''        <div className="relative w-1/3 overflow-hidden rounded-2xl bg-[#d4af37]/20 p-[1px] shadow-2xl">
          <Spotlight className="from-[#f4ede0] via-[#d4af37] to-transparent blur-3xl opacity-50" size={400} />
          <div className="relative flex h-full flex-col bg-[#1a1714]/80 backdrop-blur-md rounded-2xl">'''

content = content.replace(left_col_old, left_col_new)

# Now we need to RE-ADD the closing div for the Left Column, since we just removed it in the first step (because it was unbalanced).
# Wait, if I replace the opening tag to have 2 divs, I NEED the 2 closing divs!
content = content.replace(
    'No question available.\n            </div>\n          )}\n        </div>',
    'No question available.\n            </div>\n          )}\n          </div>\n        </div>'
)


# Fix the extra closing div at the very bottom right column? 
# In python script earlier I replaced: 
# '{output || "Awaiting your command, sailor..."}\n            </pre>\n          </div>',
# with:
# '{output || "Awaiting your command, sailor..."}\n            </pre>\n          </div>\n          </div>'
# Let's check if the opening tag of the right column was actually replaced:
# '<div className="flex w-2/3 flex-col bg-[#05080f]">' was replaced with '<div className="relative w-2/3..."><Spotlight.../><div className="...">'
# This is correct. So right column is perfectly balanced!

with open('src/app/competition/[id]/page.tsx', 'w') as f:
    f.write(content)
