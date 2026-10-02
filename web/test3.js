const fs = require('fs');
const file = 'src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  '<KageLandingPage',
  '<div className="absolute inset-0 z-50 flex items-center justify-center text-red-500 text-4xl font-bold pointer-events-none">KAGE COMPONENT IS MOUNTED</div>\n        <KageLandingPage'
);
fs.writeFileSync(file, content);
