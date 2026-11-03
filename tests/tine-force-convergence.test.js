import test from 'node:test';
import assert from 'node:assert/strict';
import {forceConvergenceReport} from '../tools/study-tine-force-convergence.mjs';

test('held half-sine averages converge toward independent continuous convolution as the step halves',()=>{
 const report=forceConvergenceReport();
 for(const fixture of report.cases){
  for(const error of fixture.referenceRefinement)assert.ok(error<1e-10,'reference quadrature must resolve errors well below the force discretization');
  for(const rate of fixture.rates)assert.ok(Math.abs(rate.impulseNs-report.impulseNs)<1e-20);
  for(let i=0;i<4;i++){
   const errors=fixture.rates.map(rate=>rate.normalizedStateErrors[i]);
   for(let k=1;k<errors.length;k++){
    const ratio=errors[k-1]/errors[k];
    assert.ok(ratio>3.5&&ratio<4.5,`expected second-order convergence, observed ${ratio}`);
    assert.ok(errors[k]>1000*fixture.referenceRefinement[i],'reference uncertainty must not dominate the observed convergence');
   }
  }
 }
});
