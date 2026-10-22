const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const Module = require('node:module');
const schemaPath = path.resolve('src/domain/schema.ts');
const mod = new Module(schemaPath, module);
mod.paths = module.paths;
mod._compile(ts.transpileModule(fs.readFileSync(schemaPath, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, schemaPath);
const fullSchema = require('zod').z.toJSONSchema(mod.exports.coachReplySchema);
delete fullSchema.$schema;
function simplify(value) {
  if (Array.isArray(value)) return value.map(simplify);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !['minLength', 'maxLength', 'minItems', 'maxItems', 'minimum', 'maximum'].includes(key)).map(([key, val]) => [key, simplify(val)]));
  return value;
}
const key = fs.readFileSync('../.env', 'utf8').match(/^GEMINI_API_KEY\s*=\s*["']?([^\r\n"']+)/m)?.[1]?.trim();
if (!key) throw new Error('Local key unavailable.');
async function request(model, extra) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ parts: [{ text: (process.argv[3] || 'Reply with a brief hello.') + (process.argv[4] === 'json' ? '\nReturn JSON matching this schema: ' + JSON.stringify(fullSchema) : '') }] }], ...extra }), signal: AbortSignal.timeout(60000),
  });
  const body = await response.json();
  console.log(JSON.stringify({ model, status: response.status, error: body.error?.message?.replaceAll(key, '[redacted]'), finish: body.candidates?.[0]?.finishReason, reply: body.candidates?.[0]?.content?.parts?.filter(p => !p.thought).map(p => p.text).join('') }));
}
(async () => {
  await request(process.argv[2] || 'gemini-3.8-flash', { generationConfig: { responseMimeType: 'application/json', ...(process.argv[4] === 'json' ? {} : {responseJsonSchema: simplify(fullSchema)}), maxOutputTokens: 10000 } });
})().catch(() => { console.error('Gemini connectivity check failed. No credentials printed.'); process.exitCode = 1; });
