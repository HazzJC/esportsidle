<script lang="ts">
  import type { Design } from '../../engine/types';
  import { designUrl } from '../designImage';

  let { design, size = 48, alt = '' }: { design: Design | null | undefined; size?: number; alt?: string } = $props();

  const url = $derived(design ? designUrl(design) : '');
</script>

{#if url}
  <img src={url} width={size} height={size} {alt} class="design-img" />
{:else}
  <span class="blank" style="width:{size}px; height:{size}px"></span>
{/if}

<style>
  .design-img {
    display: block;
    image-rendering: pixelated;
    background:
      repeating-conic-gradient(#1a1f3a 0% 25%, #141830 0% 50%) 50% / 12px 12px;
    border-radius: 4px;
  }
  .blank {
    display: block;
    border-radius: 4px;
    border: 1px dashed var(--line-2);
  }
</style>
