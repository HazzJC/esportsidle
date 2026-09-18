<script lang="ts">
  let {
    values,
    width = 110,
    height = 26,
    color = 'var(--accent)',
  }: { values: number[]; width?: number; height?: number; color?: string } = $props();

  const paths = $derived.by(() => {
    const list = Array.from(values);
    if (list.length < 2) return { line: '', area: '' };
    const min = Math.min(...list);
    const max = Math.max(...list);
    const span = max - min || 1;
    const pts = list.map((value, i) => [(i / (list.length - 1)) * width, height - 2 - ((value - min) / span) * (height - 4)]);
    const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    return { line, area: `${line} L${width} ${height} L0 ${height} Z` };
  });
</script>

<svg {width} {height} viewBox="0 0 {width} {height}" aria-hidden="true">
  <path d={paths.area} fill={color} opacity="0.14" />
  <path d={paths.line} fill="none" stroke={color} stroke-width="1.5" stroke-linejoin="round" />
</svg>
