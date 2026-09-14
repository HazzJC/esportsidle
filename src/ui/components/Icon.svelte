<script lang="ts">
  import { ICONS } from '../icons';

  let {
    name,
    size = 18,
    stroke = 2,
    color,
    class: className = '',
  }: { name: string; size?: number; stroke?: number; color?: string; class?: string } = $props();

  const Glyph = $derived(ICONS[name] ?? ICONS.sparkles);
</script>

<Glyph {size} strokeWidth={stroke} {color} class={className} aria-hidden="true" />
