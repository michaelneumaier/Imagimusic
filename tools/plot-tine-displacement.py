"""Scientific interval figure from exported statistics; optional matplotlib."""
import json
import sys
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

data = json.loads(Path(sys.argv[1]).read_text())
rows = data['rows']
limit = max(abs(p['meanM']) + p['standardDeviationM'] for r in rows for p in r['points']) * 1e6 * 1.15
fig, axes = plt.subplots(3, 1, figsize=(8, 9), sharex=True, sharey=True, layout='constrained')
fig.patch.set_facecolor('#142028')
for ax, row in zip(axes, rows):
    points = row['points']
    x = [p['xM'] * 1000 for p in points]
    mean = [p['meanM'] * 1e6 for p in points]
    lo = [(p['meanM'] - p['standardDeviationM']) * 1e6 for p in points]
    hi = [(p['meanM'] + p['standardDeviationM']) * 1e6 for p in points]
    ax.set_facecolor('#142028')
    ax.axhline(0, color='#a3afb1', linewidth=.8, linestyle=':')
    ax.fill_between(x, lo, hi, color='#8ed1c3', alpha=.3, label='Mean ± one standard deviation')
    ax.plot(x, mean, color='#e4bc7b', linewidth=2, label='Mean displacement')
    ax.set(xlim=(0, 80), ylim=(-limit, limit), ylabel='Displacement (µm)')
    ax.set_title(f"{row['nominalDurationMs']:g} ms · {row['sampleCount']} samples", loc='left', color='#eee8dc', fontsize=16)
    ax.tick_params(colors='#eee8dc', labelsize=12)
    ax.yaxis.label.set(color='#eee8dc', fontsize=13)
    ax.xaxis.label.set(color='#eee8dc', fontsize=13)
    for spine in ax.spines.values():
        spine.set_color('#70858b')
    ax.grid(alpha=.15, color='#b9c9cd')
axes[-1].set_xlabel('Distance from clamp (mm)')
legend = axes[0].legend(loc='lower left', fontsize=11, facecolor='#142028', edgecolor='#70858b')
for text in legend.get_texts():
    text.set_color('#eee8dc')
fig.savefig(sys.argv[2], dpi=170, facecolor=fig.get_facecolor())
fig.savefig(str(Path(sys.argv[2]).with_suffix('.svg')), facecolor=fig.get_facecolor())
plt.close(fig)
