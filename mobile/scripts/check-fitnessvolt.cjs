// Explicit network check. All comparison inputs below are synthetic.
const fs = require('node:fs'), ts = require('typescript'), Module = require('node:module');
Module._extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const { fetchFitnessVolt } = require('../src/services/fitnessVolt.ts');
fetchFitnessVolt({ recordId: 'synthetic-api-check', lift: 'bench-press', sex: 'male', bodyweightKg: 90, e1rmKg: 125, age: 30 }).then(result => console.log(JSON.stringify(result))).catch(e => { console.error(e.message); process.exitCode = 1; });
