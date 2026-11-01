import {canonicalImportedScore,compileImportedScore} from '../midi/mapping.js';
import {createAuthoredPerformance} from './authored-performance.js';
import {DEFAULT_COMPOSITION,validateComposition} from './composition.js';

/** The committed mapping drives every child entrance. No absent imported child
 * can fall back to its legacy pattern. Preview may show unresolved assignments;
 * an actual performance must resolve them first. */
export function createImportedPerformance(patch,imported,composition=DEFAULT_COMPOSITION,sampleRate=48000){
  const saved=JSON.parse(canonicalImportedScore(imported));
  const {recipe,report}=compileImportedScore(saved,patch,sampleRate);
  if(report.counts.unassigned)throw new Error(`${report.counts.unassigned} notes still need an instrument assignment. Assign them or explicitly omit them before using this mapping.`);
  const importedComposition=validateComposition(composition,sampleRate);
  const ensemble=structuredClone(importedComposition),childrenDisabledByImport=[];
  for(const family of ['loom','fm']){
    if(report.children[family]){
      if(!ensemble[family]?.enabled)throw new Error(`This mapping contains ${family==='loom'?'Tension Loom':'FM tensioner'} events. Enable that instrument before using this mapping.`);
    }else if(ensemble[family]?.enabled){
      ensemble[family].enabled=false;childrenDisabledByImport.push(family);
    }
  }
  const passage=createAuthoredPerformance(patch,recipe,ensemble,sampleRate);
  return {...passage,composition:ensemble,importedComposition,imported:saved,mappingReport:report,childrenDisabledByImport};
}
