<script lang="ts">
  import Icon from './Icon.svelte';

  /** A bouncing pointer that sits just above whatever the tutorial wants clicked next. */
  let { label }: { label: string } = $props();
</script>

<div class="tut-arrow" role="note">
  <span class="bounce"><Icon name="arrow-down" size={16} stroke={2.6} /></span>
  <span class="label">{label}</span>
  <span class="bounce late"><Icon name="arrow-down" size={16} stroke={2.6} /></span>
</div>

<style>
  .tut-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 2px 0 4px;
    color: var(--accent);
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 12px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    pointer-events: none;
  }
  .label {
    text-shadow: 0 0 12px color-mix(in srgb, var(--accent) 45%, transparent);
  }
  .bounce {
    display: grid;
    animation: tut-bounce 0.9s ease-in-out infinite;
  }
  .bounce.late {
    animation-delay: 0.15s;
  }
  @keyframes tut-bounce {
    0%,
    100% {
      transform: translateY(-2px);
    }
    50% {
      transform: translateY(4px);
    }
  }
</style>
