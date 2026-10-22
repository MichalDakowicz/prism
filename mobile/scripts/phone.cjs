// Local ADB smoke-test helper. Acts only on observed PRISM controls.
const fs = require('node:fs');
const cp = require('node:child_process');
const path = require('node:path');
const adb = path.join(process.env.LOCALAPPDATA, 'Android/Sdk/platform-tools/adb.exe');
const serial = process.env.PRISM_DEVICE || '00166152F003681';
const run = (...args) => cp.execFileSync(adb, ['-s', serial, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const decode = s => s.replace(/&#10;/g, '\n').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
function nodes() {
  run('shell', 'uiautomator', 'dump', '/sdcard/prism-ui.xml');
  const xml = run('shell', 'cat', '/sdcard/prism-ui.xml');
  const list = [...xml.matchAll(/<node\s+([^>]+)>?/g)].map(m => Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(a => [a[1], decode(a[2])])));
  if (!list.some(n => n.package === 'app.prism.strength')) throw new Error('PRISM is not visible.');
  return list.filter(n => n.package === 'app.prism.strength');
}
function find(label) {
  const list = nodes();
  const visible = list.filter(n => { const b = n.bounds?.match(/\d+/g)?.map(Number); return b && b[2] > b[0] && b[3] > b[1] && b[1] > 125 && b[3] < 2360; });
  const node = visible.find(n => n['content-desc'] === label) || visible.find(n => n.text === label) || visible.find(n => n['resource-id'] === label);
  if (!node) throw new Error(`Visible control not found: ${label}`);
  return node;
}
function tap(node) {
  const [x1, y1, x2, y2] = node.bounds.match(/\d+/g).map(Number);
  run('shell', 'input', 'tap', String(Math.round((x1 + x2) / 2)), String(Math.round((y1 + y2) / 2)));
}
function fill(label, value) {
  const node = find(label); tap(node);
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 400);
  run('shell', 'input', 'keycombination', '113', '29');
  run('shell', 'input', 'keyevent', '67');
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
  run('shell', 'input', 'text', value.replace(/ /g, '%s'));
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300);
}
const [action, ...args] = process.argv.slice(2);
try {
  if (action === 'snapshot') {
    console.log(nodes().filter(n => (n.text || n['content-desc']) && !/^[\uE000-\uFFFF]$/.test(n.text)).map(n => ({ label: n.password === 'true' ? '[masked]' : n['content-desc'] || n.text, value: n.class === 'android.widget.EditText' && n.password !== 'true' ? n.text : undefined, bounds: n.bounds, input: n.class === 'android.widget.EditText', selected: n.selected === 'true' })));
  } else if (action === 'tap') tap(find(args[0]));
  else if (action === 'fill') fill(args[0], args[1]);
  else if (action === 'back') run('shell', 'input', 'keyevent', '4');
  else if (action === 'scroll') run('shell', 'input', 'swipe', '540', args[0] === 'up' ? '650' : '1800', '540', args[0] === 'up' ? '1800' : '650', '420');
  else if (action === 'shot') {
    nodes(); fs.mkdirSync('artifacts/screenshots', { recursive: true });
    run('shell', 'screencap', '-p', '/sdcard/prism-screen.png');
    run('pull', '/sdcard/prism-screen.png', `artifacts/screenshots/${args[0]}.png`);
    console.log(`Saved screenshot: ${args[0]}`);
  } else if (action === 'provision-key') {
    const input = find('GEMINI API KEY');
    if (input.password !== 'true') throw new Error('Credential field is not masked.');
    const env = fs.readFileSync(path.join(__dirname, '../../.env'), 'utf8');
    const value = env.match(/^GEMINI_API_KEY\s*=\s*["']?([^\r\n"']+)/m)?.[1]?.trim();
    if (!value || !/^[\w.-]+$/.test(value)) throw new Error('Local credential missing or invalid.');
    fill('GEMINI API KEY', value);
    console.log('Credential entered in masked PRISM field.');
  } else throw new Error('Unknown phone action.');
} catch (e) {
  // Do not echo a child-process command; it could contain a credential.
  console.error(action === 'provision-key' ? 'Credential provisioning failed; no secret printed.' : e.message);
  process.exitCode = 1;
}
