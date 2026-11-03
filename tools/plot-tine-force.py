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
