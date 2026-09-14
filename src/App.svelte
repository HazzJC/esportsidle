<script lang="ts">
  let cash = $state(0);
</script>

<div class="shell">
  <header class="top panel">
    <span class="brand">ESPORTS<b>IDLE</b></span>
    <span class="muted">Build your org from a garage to the Multiverse Finals.</span>
  </header>
  <main class="cols">
    <section class="panel col left">
      <button class="logo" onclick={() => (cash += 1)} aria-label="Grind">🎮</button>
      <div class="cash num">${cash}</div>
    </section>
    <section class="panel col mid"><h2 class="section-title">Gaming House</h2></section>
    <section class="panel col right"><h2 class="section-title">Store</h2></section>
  </main>
</div>

<style>
  .shell {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 10px;
    gap: 10px;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 14px;
  }
  .brand {
    font-family: var(--font-display);
    font-weight: 900;
    letter-spacing: 0.1em;
  }
  .brand b {
    color: var(--cyan);
  }
  .cols {
    flex: 1;
    display: grid;
    grid-template-columns: 340px 1fr 380px;
    gap: 10px;
    min-height: 0;
  }
  .col {
    padding: 12px;
    overflow: auto;
  }
  .left {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .logo {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    border: 2px solid var(--cyan);
    background: var(--panel-3);
    font-size: 80px;
  }
  .cash {
    font-family: var(--font-display);
    font-size: 28px;
  }
</style>
