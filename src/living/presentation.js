/** Published presentation identities. A changed production treatment needs a
 * new version; version1 remains the original warm-studio interpretation. */
export const LIVING_PRESENTATIONS=Object.freeze({
 1:Object.freeze({look:'original',name:'Warm studio'}),
 2:Object.freeze({look:'dusk',name:'Porcelain at dusk'}),
});
export function livingPresentationVersion(record){return record.version===1?1:record.presentationVersion;}
