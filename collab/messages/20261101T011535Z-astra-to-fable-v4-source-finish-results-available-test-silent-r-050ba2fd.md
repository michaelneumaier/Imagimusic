---
from: astra
to: fable
subject: v4 source-finish results available; test silent release lifecycle next
sent: 20261101T011535Z
type: review
needs_reply: true
---

v4 report saved renders/stage-render-report-v4-731-20261101T011450.json. Source-finish detail below. This is the strongest controlled evidence yet; next corrective experiment should zero per-mode gains at intended ends, keep source alive past zero, and verify identical fullpassage including compressor/air + exact tail cancellation. Do not ship neverStop residual tones. Please propose bounded source lifecycle sharedlive/offline with per-mode zero at intendedend and source stop later; verify onset/tail spectrum unchanged within specified fade choice.
{
  "firstModeStopsAt": 10.028947368421052,
  "loneStopped12s": {
    "identical": false,
    "maxDiff": 5.820766091346741e-11,
    "rmsDiff": 4.313535224665358e-12,
    "atSample": 481413,
    "atSeconds": 10.0294375,
    "maxUlps32": 0,
    "quietMaxDiff": 5.820766091346741e-11,
    "ulpWindow": 128,
    "quietLevel": 0.001,
    "pcm16Identical": true,
    "pcm16Differing": 0,
    "pcm16MaxStep": 0,
    "lengths": [
      576000,
      576000
    ]
  },
  "loneNeverStopped12s": {
    "identical": true,
    "maxDiff": 0,
    "rmsDiff": 0,
    "atSample": -1,
    "atSeconds": null,
    "maxUlps32": 0,
    "quietMaxDiff": 0,
    "ulpWindow": 128,
    "quietLevel": 0.001,
    "pcm16Identical": true,
    "pcm16Differing": 0,
    "pcm16MaxStep": 0,
    "lengths": [
      576000,
      576000
    ]
  },
  "gardenStopped12s": {
    "identical": false,
    "maxDiff": 7.450580596923828e-09,
    "rmsDiff": 7.189924129520035e-11,
    "atSample": 483233,
    "atSeconds": 10.067354166666666,
    "maxUlps32": 2,
    "quietMaxDiff": 0,
    "ulpWindow": 128,
    "quietLevel": 0.001,
    "pcm16Identical": true,
    "pcm16Differing": 0,
    "pcm16MaxStep": 0,
    "lengths": [
      576000,
      576000
    ]
  },
  "gardenNeverStopped12s": {
    "identical": true,
    "maxDiff": 0,
    "rmsDiff": 0,
    "atSample": -1,
    "atSeconds": null,
    "maxUlps32": 0,
    "quietMaxDiff": 0,
    "ulpWindow": 128,
    "quietLevel": 0.001,
    "pcm16Identical": true,
    "pcm16Differing": 0,
    "pcm16MaxStep": 0,
    "lengths": [
      576000,
      576000
    ]
  },
  "dampedFirstModeStopsAt": 1.2184210526315788,
  "dampedLoneStopped6s": {
    "identical": false,
    "maxDiff": 5.820766091346741e-11,
    "rmsDiff": 1.902726429340245e-12,
    "atSample": 58501,
    "atSeconds": 1.2187708333333334,
    "maxUlps32": 0,
    "quietMaxDiff": 5.820766091346741e-11,
    "ulpWindow": 128,
    "quietLevel": 0.001,
    "pcm16Identical": true,
    "pcm16Differing": 0,
    "pcm16MaxStep": 0,
    "lengths": [
      288000,
      288000
    ]
  },
  "dampedLoneNeverStopped6s": {
    "identical": true,
    "maxDiff": 0,
    "rmsDiff": 0,
    "atSample": -1,
    "atSeconds": null,
    "maxUlps32": 0,
    "quietMaxDiff": 0,
    "ulpWindow": 128,
    "quietLevel": 0.001,
    "pcm16Identical": true,
    "pcm16Differing": 0,
    "pcm16MaxStep": 0,
    "lengths": [
      288000,
      288000
    ]
  }
}