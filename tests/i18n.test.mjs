import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const dictionary={window:{}};
vm.runInNewContext(read('translations.js'),dictionary);
const translations=dictionary.window.CLAXON_TRANSLATIONS;
for (const [source,values] of Object.entries(translations)) {
  assert.equal(values.length,4,source);
  const params=text=>[...text.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();
  for(const text of values) {
    assert.ok(text.trim(),source);
    assert.deepEqual(params(text),params(source),`Placeholders: ${source}`);
  }
}
const app=read('app.js'), experience=read('experience.js');
const core=read('i18n.js').split('  // Capture source copy once.')[0]+'})();';
const sourceObjects=[
  app.match(/const moments = (\{[\s\S]*?\n\});/)[1],
  experience.match(/const journeyStates = (\[[\s\S]*?\n  \]);/)[1],
  experience.match(/const recipes = (\{[\s\S]*?\n  \});/)[1],
  experience.match(/const ingredients = (\{[\s\S]*?\n  \});/)[1]
];
for(const language of ['it','es','fr','de','en']) {
  const context=vm.createContext({window:{CLAXON_TRANSLATIONS:translations}, URL, location:{href:'https://example.test/'}, localStorage:{getItem:()=>language}});
  vm.runInContext(core,context);
  context.ClaxonI18n=context.window.ClaxonI18n;
  vm.runInContext(read('catalogue.js'),context);
  const localise=context.ClaxonI18n.localise;
  for(const source of sourceObjects) {
    const object=vm.runInContext('('+source+')',context); localise(object);
    // Force every translated getter, including all tags, hints and descriptions.
    JSON.stringify(object);
  }
  const data=context.window.CLAXON_DATA;
  JSON.stringify(data);
  assert.equal(data.menu.pizza[0].id,'pizza-classica');
  assert.equal(data.gallery[0].category,'Al banco');
  assert.equal(data.hours.timezone,'Europe/Zurich');
  assert.equal(context.ClaxonI18n.missing.size,0,`Missing ${language}: ${[...context.ClaxonI18n.missing].join(', ')}`);
  const message=context.ClaxonI18n.t('Ciao Claxon! Mi interessa {name}. Mi dite la proposta disponibile e il prezzo aggiornato? Grazie!',{name:data.menu.pizza[1].name});
  assert.ok(message.includes(data.menu.pizza[1].name));
  assert.ok(!message.includes('{name}'));
}
console.log(`${Object.keys(translations).length} entries checked across 5 languages; all catalogue and interaction copy covered; placeholders and stable IDs verified.`);
