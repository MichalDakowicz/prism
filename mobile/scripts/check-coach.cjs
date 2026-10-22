// Explicit live integration check; sends synthetic data only.
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const key = fs.readFileSync('../.env', 'utf8').match(/^GEMINI_API_KEY\s*=\s*["']?([^\r\n"']+)/m)?.[1]?.trim();
if (!key) throw new Error('Local credential unavailable.');
Module._extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const original = Module._load;
Module._load = function(request, parent, main) {
  if (request.endsWith('/credentials')) return { getApiKey: async () => key };
  return original.call(this, request, parent, main);
};
const { askCoach } = require('../src/services/gemini.ts');
const { emptyData } = require('../src/domain/schema.ts');
const { guidedPlan, savePlan } = require('../src/domain/plans.ts');
(async () => {
  let data = emptyData(); data.profile.geminiModel = process.argv[2] || 'gemini-3.8-flash';
  data = savePlan(data, guidedPlan({ ...data.profile, daysPerWeek: 1 }, 'arms'));
  const result = await askCoach(data, { profile: true, records: true, plan: true, rest: false }, null, [{ id: 'test', role: 'user', text: 'Create one day plan named ADB smoke test with bench press only three sets of five reps on Monday and load unset', date: new Date().toISOString() }], AbortSignal.timeout(60000));
  console.log(JSON.stringify({ model: data.profile.geminiModel, reply: result.reply, proposalName: result.proposal?.name, days: result.proposal?.days.length, persistedPlanName: data.plans[0].name }));
})().catch(e => { console.error(String(e.message).replaceAll(key, '[redacted]')); process.exitCode = 1; });
