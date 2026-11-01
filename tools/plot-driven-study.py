#!/usr/bin/env python3
"""Plot measured driver traces. Requires matplotlib; input schema is documented below.
JSON: {title, duration, release, cases:[{label, trace:[{time, energy, bound}]}]}.
Energy uses mass-normalized mechanical model units; bound is output amplitude.
This presentation adapter never simulates a force or changes a trace.
"""
import argparse
import json
import math
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('trace_json', type=Path)
parser.add_argument('output', type=Path, help='PNG or SVG destination')
args = parser.parse_args()
data = json.loads(args.trace_json.read_text())

def finite(value):
    return isinstance(value, (float, int)) and not isinstance(value, bool) and math.isfinite(value)

if not all(finite(data.get(k)) for k in ('duration', 'release')) or not 0 < data['release'] < data['duration']:
    raise ValueError('Require 0 < release < duration, in seconds')
if not isinstance(data.get('cases'), list) or not 1 <= len(data['cases']) <= 6:
    raise ValueError('Require 1..6 measured cases')
for case in data['cases']:
    trace = case.get('trace')
    if not isinstance(case.get('label'), str) or not isinstance(trace, list) or len(trace) < 2:
        raise ValueError('Each case needs a label and at least two trace points')
    previous = -1
    for point in trace:
        if not all(finite(point.get(k)) for k in ('time', 'energy', 'bound')):
            raise ValueError('Trace values must be finite')
        if not previous < point['time'] <= data['duration'] or point['time'] < 0 or min(point['energy'], point['bound']) < 0:
            raise ValueError('Times must increase within duration; energy/bound must be nonnegative')
        previous = point['time']
    if trace[0]['time'] != 0 or abs(trace[-1]['time'] - data['duration']) > 1e-9:
        raise ValueError('Each trace must span zero through the declared duration')

plt.rcParams.update({'font.family':'DejaVu Sans', 'font.size':11, 'axes.spines.top':False, 'axes.spines.right':False})
fig, axes = plt.subplots(2, 1, figsize=(10, 7), sharex=True, layout='constrained')
colors = ['#31716d', '#a55575', '#9b6b20', '#5d5cb0', '#5f7d2b', '#675b51']
for case, color in zip(data['cases'], colors):
    t = [p['time'] for p in case['trace']]
    axes[0].plot(t, [p['energy'] for p in case['trace']], color=color, label=case['label'], linewidth=1.8)
    axes[1].plot(t, [p['bound'] for p in case['trace']], color=color, linewidth=1.8)
for ax in axes:
    ax.axvspan(0, data['release'], color='#d9e4e3', alpha=.45, zorder=-1)
    ax.axvline(data['release'], color='#555555', linestyle='--', linewidth=1)
    ax.set_xlim(0, data['duration'])
    ax.set_ylim(bottom=0)
    ax.grid(axis='y', alpha=.2)
axes[0].set_ylabel('Mechanical energy\n(model units)')
axes[0].ticklabel_format(axis='y', style='sci', scilimits=(-3, 3))
axes[1].set_ylabel('State-derived output bound\n(amplitude, full scale = 1)')
axes[1].set_xlabel('Time (seconds)')
axes[0].legend(loc='upper right', frameon=False)
axes[0].text(data['release']/(2*data['duration']), 1.03, 'DRIVER ACTIVE', transform=axes[0].transAxes, ha='center', fontsize=10, color='#31716d')
axes[0].text((1+data['release']/data['duration'])/2, 1.03, 'DRIVER RELEASED', transform=axes[0].transAxes, ha='center', fontsize=10, color='#555555')
fig.suptitle(data.get('title', 'Powered interval and release'), fontsize=18, x=.1, ha='left')
fig.supxlabel('Bounds are ceilings derived from model state, not audio waveforms or loudness.\nLines join sampled trace points; the release line marks the external driver stopping.', fontsize=10)
args.output.parent.mkdir(parents=True, exist_ok=True)
fig.savefig(args.output, dpi=160)
plt.close(fig)
print(args.output)
