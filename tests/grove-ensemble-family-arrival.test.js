import test from 'node:test';
import assert from 'node:assert/strict';
import {ensembleFamilyFromSearch} from '../src/grove/ensemble-family-arrival.js';
test('only one explicit curated family changes the arrival anatomy',()=>{
 for(const seed of [3,7,11])assert.equal(ensembleFamilyFromSearch(`?family=${seed}`),seed);
 assert.equal(ensembleFamilyFromSearch('?from=study&family=7'),7);
 for(const search of ['', '?family=', '?family=19', '?family=07', '?family=7.0','?family=7e0','?family=-7','?family=Infinity','?family=7&family=11','?family=7&family=7','?family=%207','?Family=7'])assert.equal(ensembleFamilyFromSearch(search),3,search);
});
