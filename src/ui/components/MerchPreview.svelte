<script lang="ts">
  import type { Design } from '../../engine/types';
  import DesignImage from './DesignImage.svelte';
  export let productId: string;
  export let design: Design | undefined;
  export let quality = 0;
  export let primary = '#22e4ff';
  export let secondary = '#8b5cff';
</script>

<div class="stage" class:premium={quality >= 5} style="--primary:{primary};--secondary:{secondary};--shine:{1 + quality * 0.06};--glow:{quality * 2}px" aria-label="{productId} preview, quality level {quality}">
  <div class="item {productId}">
    {#if productId === 'tee' || productId === 'hoodie' || productId === 'jersey'}
      <div class="collar"></div><div class="sleeve left"></div><div class="sleeve right"></div>
      {#if productId === 'hoodie'}<div class="hood"></div>{/if}
    {:else if productId === 'mug'}
      <div class="handle"></div>
    {:else if productId === 'cap'}
      <div class="brim"></div>
    {:else if productId === 'sneakers'}
      <div class="sole"></div>
    {:else if productId === 'keycaps'}
      <div class="keys"></div>
    {:else if productId === 'plushie'}
      <div class="ear left"></div><div class="ear right"></div>
    {/if}
    <div class="print"><DesignImage {design} size={42} /></div>
  </div>
  {#if quality > 0}<span class="finish">Q{quality} · {quality >= 5 ? 'Pro' : 'Standard'}</span>{/if}
</div>

<style>
  .stage { position:relative; flex:none; width:112px; height:104px; display:grid; place-items:center; overflow:hidden; border-radius:10px; border:1px solid var(--line-2); background:radial-gradient(circle at 50% 30%,color-mix(in srgb,var(--primary) 18%,transparent),transparent 70%),repeating-linear-gradient(0deg,transparent 0 13px,rgba(255,255,255,.025) 13px 14px),var(--bg-3); }
  .stage.premium { box-shadow:inset 0 0 20px color-mix(in srgb,var(--primary) 28%,transparent); border-color:var(--primary); }
  .item { position:relative; width:74px; height:68px; display:grid; place-items:center; background:linear-gradient(135deg,var(--secondary),#1b2041 65%); border:2px solid color-mix(in srgb,var(--primary) 65%,white); filter:brightness(var(--shine)); box-shadow:4px 5px 0 rgba(0,0,0,.32), 0 0 var(--glow) var(--primary), inset 0 0 0 3px rgba(255,255,255,.07); }
  .print { position:relative; z-index:2; display:grid; place-items:center; width:44px; height:44px; overflow:hidden; border-radius:3px; background:rgba(0,0,0,.18); transform:scale(.75); }
  .tee,.hoodie,.jersey { width:61px; height:65px; border-radius:8px 8px 4px 4px; }
  .sleeve { position:absolute; top:4px; width:17px; height:23px; background:var(--secondary); border:2px solid var(--primary); }
  .sleeve.left { left:-18px; transform:skewY(-18deg); }
  .sleeve.right { right:-18px; transform:skewY(18deg); }
  .collar { position:absolute; top:-2px; width:19px; height:9px; border-radius:0 0 12px 12px; background:var(--bg-3); border:2px solid var(--primary); }
  .hood { position:absolute; top:-13px; width:33px; height:20px; border:3px solid var(--primary); border-radius:15px 15px 2px 2px; background:var(--secondary); }
  .jersey { background:linear-gradient(90deg,var(--secondary) 0 34%,var(--primary) 35% 43%,var(--secondary) 44%); }
  .cap { height:43px; border-radius:42px 42px 10px 10px; }
  .cap .print { transform:scale(.58); }
  .brim { position:absolute; z-index:3; bottom:-9px; left:28px; width:62px; height:12px; border-radius:3px 15px 5px 3px; background:var(--primary); transform:skewX(-25deg); }
  .mug { width:60px; height:64px; border-radius:3px 3px 12px 12px; }
  .handle { position:absolute; right:-26px; top:12px; width:25px; height:36px; border:7px solid var(--primary); border-radius:0 14px 14px 0; }
  .mousepad { width:91px; height:54px; border-radius:5px; transform:perspective(110px) rotateX(22deg); }
  .poster { width:63px; height:83px; border:5px solid var(--primary); }
  .poster .print { transform:scale(1.4); }
  .keycaps { width:91px; height:52px; border-radius:5px; }
  .keys { position:absolute; inset:5px; background:repeating-linear-gradient(90deg,transparent 0 10px,var(--primary) 10px 12px),repeating-linear-gradient(0deg,transparent 0 10px,var(--primary) 10px 12px); opacity:.45; }
  .sneakers { width:86px; height:43px; border-radius:35px 8px 5px 5px; transform:skewX(-12deg); }
  .sole { position:absolute; bottom:-8px; width:100%; height:9px; background:var(--primary); border-radius:3px; }
  .plushie { width:62px; height:62px; border-radius:40%; }
  .ear { position:absolute; top:-14px; width:21px; height:25px; background:var(--secondary); border:2px solid var(--primary); transform:rotate(-20deg); }
  .ear.left { left:0; }.ear.right { right:0; transform:rotate(20deg); }
  .finish { position:absolute; z-index:3; right:3px; bottom:2px; padding:1px 4px; border-radius:3px; background:#101326; color:var(--primary); font-size:9px; font-weight:800; }
</style>
