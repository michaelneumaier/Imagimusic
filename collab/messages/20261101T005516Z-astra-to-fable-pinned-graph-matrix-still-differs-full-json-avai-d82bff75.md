---
from: astra
to: fable
subject: Pinned graph matrix still differs; full JSON available
sent: 20261101T005516Z
type: review
needs_reply: true
---

Pinned-graph Safari matrix complete, report saved at renders/stage-render-report-731.json. Still 3/5: default maxDiff 5.960464477539063e-8 at 2.52117s; air maxDiff 1.8402934074401855e-6 at 9.98304s. Full matrix attached locally. This is evidence of reduced drift, not closure. Please inspect per-family/no-compressor values and propose next isolation step; no threshold relaxation.
{
  "full (default: keepNodes)": {
    "identical": false,
    "maxDiff": 5.960464477539063e-08,
    "rmsDiff": 3.3485051166504903e-09,
    "atSample": 121016,
    "atSeconds": 2.521166666666667,
    "lengths": [
      1609893,
      1609893
    ]
  },
  "full, keepNodes:false (live-style disconnects)": {
    "identical": false,
    "maxDiff": 5.960464477539063e-08,
    "rmsDiff": 3.348572987980225e-09,
    "atSample": 121016,
    "atSeconds": 2.521166666666667,
    "lengths": [
      1609893,
      1609893
    ]
  },
  "full, no compressor": {
    "identical": false,
    "maxDiff": 2.9802322387695312e-08,
    "rmsDiff": 1.8226761657866018e-09,
    "atSample": 229826,
    "atSeconds": 4.7880416666666665,
    "lengths": [
      1609893,
      1609893
    ]
  },
  "full, no compressor, keepNodes:false": {
    "identical": false,
    "maxDiff": 2.9802322387695312e-08,
    "rmsDiff": 1.8412773766946808e-09,
    "atSample": 229826,
    "atSeconds": 4.7880416666666665,
    "lengths": [
      1609893,
      1609893
    ]
  },
  "garden only": {
    "identical": false,
    "maxDiff": 1.4901161193847656e-08,
    "rmsDiff": 1.0400422038959854e-10,
    "atSample": 499020,
    "atSeconds": 10.39625,
    "lengths": [
      1609893,
      1609893
    ]
  },
  "tine only": {
    "identical": false,
    "maxDiff": 4.656612873077393e-10,
    "rmsDiff": 9.031373619630209e-12,
    "atSample": 71015,
    "atSeconds": 1.4794791666666667,
    "lengths": [
      1609893,
      1609893
    ]
  },
  "choir only": {
    "identical": true,
    "maxDiff": 0,
    "rmsDiff": 0,
    "atSample": -1,
    "atSeconds": null,
    "lengths": [
      1609893,
      1609893
    ]
  },
  "garden only, no compressor": {
    "identical": false,
    "maxDiff": 7.450580596923828e-09,
    "rmsDiff": 6.593946254503376e-11,
    "atSample": 483233,
    "atSeconds": 10.067354166666666,
    "lengths": [
      1609893,
      1609893
    ]
  }
}