<script lang="ts">
  let {
    checked,
    label,
    description,
    onchange,
  }: { checked: boolean; label: string; description?: string; onchange: (value: boolean) => void } = $props();
</script>

<label class="toggle">
  <span class="text">
    <span class="label">{label}</span>
    {#if description}<span class="desc">{description}</span>{/if}
  </span>
  <input type="checkbox" {checked} onchange={(e) => onchange(e.currentTarget.checked)} />
  <span class="switch" aria-hidden="true"><i></i></span>
</label>

<style>
  .toggle {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    cursor: pointer;
  }
  .text {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .label {
    font-weight: 600;
  }
  .desc {
    font-size: 12px;
    color: var(--muted);
  }
  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  .switch {
    position: relative;
    width: 40px;
    height: 22px;
    border-radius: 999px;
    background: var(--bg-2);
    border: 1px solid var(--line-2);
    transition: background 0.15s;
    flex: none;
  }
  .switch i {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--muted);
    transition:
      transform 0.15s,
      background 0.15s;
  }
  input:checked + .switch {
    background: rgba(34, 228, 255, 0.25);
    border-color: var(--cyan);
  }
  input:checked + .switch i {
    transform: translateX(18px);
    background: var(--cyan);
  }
  input:focus-visible + .switch {
    outline: 2px solid var(--cyan);
    outline-offset: 2px;
  }
</style>
