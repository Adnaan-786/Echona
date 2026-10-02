const fs = require('fs');
const file = 'public/landing-pages/kage.html';
let content = fs.readFileSync(file, 'utf8');

// Force preEl to disappear unconditionally after 1 second as a failsafe
content = content.replace(
  'function boot() {',
  'setTimeout(() => { document.getElementById("pre").style.display = "none"; }, 1000);\nfunction boot() {'
);

fs.writeFileSync(file, content);
