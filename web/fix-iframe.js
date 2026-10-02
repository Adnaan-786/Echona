const fs = require('fs');
const file = 'src/lib/threeui/landing-pages/LandingPageFrame.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'const [ready, setReady] = useState(false);',
  `const [ready, setReady] = useState(false);
  useEffect(() => {
    if (frameRef.current) {
      // If it's already loaded by the time React hydrates
      try {
        if (frameRef.current.contentDocument?.readyState === 'complete') {
          setReady(true);
        }
      } catch (e) {}
    }
  }, []);`
);
fs.writeFileSync(file, content);
