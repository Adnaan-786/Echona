const fs = require('fs');
const file = 'public/landing-pages/kage.html';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'document.body.appendChild(e);',
  'document.body.appendChild(e); document.getElementById("pre").style.display = "none"; document.getElementById("pre").style.opacity = "0"; console.error("FALLBACK TRIGGERED", err);'
);

fs.writeFileSync(file, content);
