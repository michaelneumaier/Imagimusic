#!/usr/bin/env python3
"""Plot the actual held forces from render-tine-force-study's report.
Requires matplotlib. Usage: python plot-tine-force.py report.json output.svg
The renderer can call this with IMAGIMUSIC_PLOT_PYTHON=/path/to/python.
Without that optional interpreter, the study retains its numerical force table.
"""
import json
import math
import sys
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

data = json.loads(Path(sys.argv[1]).read_text())
rate = data['sampleRate']
fig, ax = plt.subplots(figsize=(7, 4.5), layout='constrained')
fig.patch.set_facecolor('#142028')
ax.set_facecolor('#142028')
for row, color, style in zip([r for r in data['rows'] if r['forceN']], ['#e4bc7b', '#c9b3e4', '#8ed1c3'], ['-', '--', ':']):
    force = row['forceN']
    if len(force) != row['pulseFrames'] or not all(math.isfinite(x) for x in force):
        raise ValueError('Invalid force trace')
    if not math.isclose(sum(force) / rate, data['impulseNs'], rel_tol=1e-12):
        raise ValueError('Force trace does not preserve declared impulse')
    edges = [1000 * i / rate for i in range(len(force) + 1)]
    ax.stairs([1000 * x for x in force], edges, label=f"{row['durationMs']:g} ms", color=color, linestyle=style, linewidth=2)
ax.set(xlim=(0, 4), ylim=(0, .35), xlabel='Time from excitation onset (ms)', ylabel='Prescribed force (mN)')
ax.set_xticks([0, 1, 2, 3, 4])
ax.set_yticks([0, .1, .2, .3])
ax.tick_params(colors='#eee8dc', labelsize=13)
ax.xaxis.label.set(color='#eee8dc', fontsize=14)
ax.yaxis.label.set(color='#eee8dc', fontsize=14)
for spine in ax.spines.values():
    spine.set_color('#70858b')
ax.grid(alpha=.2, color='#b9c9cd')
legend = ax.legend(fontsize=14, facecolor='#142028', edgecolor='#70858b')
for text in legend.get_texts():
    text.set_color('#eee8dc')
fig.savefig(sys.argv[2], facecolor=fig.get_facecolor())
fig.savefig(str(Path(sys.argv[2]).with_suffix('.png')), dpi=160, facecolor=fig.get_facecolor())
plt.close(fig)

fig, ax = plt.subplots(figsize=(7, 5), layout='constrained')
fig.patch.set_facecolor('#142028')
ax.set_facecolor('#142028')
bottom = [0.0] * len(data['rows'])
for i, (color, hatch) in enumerate(zip(['#e4bc7b', '#c9b3e4', '#8ed1c3', '#82a9d6'], ['', '//', '..', 'xx'])):
    values = [row['comparisonModes'][i]['energyJ'] * 1e12 for row in data['rows']]
    if not all(math.isfinite(x) and x >= 0 for x in values):
        raise ValueError('Invalid modal energy')
    ax.bar(range(len(values)), values, bottom=bottom, color=color, edgecolor='#142028', hatch=hatch, label=f"Mode {i+1} · {data['frequenciesHz'][i]:.0f} Hz")
    bottom = [a + b for a, b in zip(bottom, values)]
ax.set_xticks(range(4), ['Impulse', '0.5 ms', '1 ms', '4 ms'])
ax.set_ylabel('Stored mechanical energy (pJ)', fontsize=14, color='#eee8dc')
ax.tick_params(colors='#eee8dc', labelsize=13)
ax.set_axisbelow(True)
ax.grid(axis='y', alpha=.2, color='#b9c9cd')
for spine in ax.spines.values():
    spine.set_color('#70858b')
legend = ax.legend(fontsize=11, ncol=2, loc='lower left', bbox_to_anchor=(0, 1.01), facecolor='#142028', edgecolor='#70858b')
for text in legend.get_texts():
    text.set_color('#eee8dc')
energy_path = Path(sys.argv[2]).with_name('energy.svg')
fig.savefig(energy_path, facecolor=fig.get_facecolor())
fig.savefig(energy_path.with_suffix('.png'), dpi=160, facecolor=fig.get_facecolor())
plt.close(fig)
