import { getBlockMeta } from "../world/blockTypes.js";

export function createHotbarView({ root }) {
  if (!root) {
    throw new Error("Hotbar root element is required.");
  }

  const slotEls = [];
  let lastSignature = "";

  function render(hotbar) {
    if (!hotbar || !Array.isArray(hotbar.slots)) {
      return;
    }

    const signature = `${hotbar.selectedIndex}:${hotbar.slots.join(",")}`;
    if (signature === lastSignature) {
      return;
    }
    lastSignature = signature;

    ensureSlots(hotbar.slots.length);

    for (let i = 0; i < hotbar.slots.length; i += 1) {
      const slotEl = slotEls[i];
      const blockId = hotbar.slots[i];
      const meta = getBlockMeta(blockId);

      slotEl.classList.toggle("active", i === hotbar.selectedIndex);
      slotEl.setAttribute("aria-label", `${i + 1}: ${meta.name}`);
      slotEl.title = `${i + 1}. ${meta.name}`;

      const blockEl = slotEl.querySelector(".hotbar-block");
      blockEl.style.backgroundColor = toColor(meta.color);
    }
  }

  function ensureSlots(size) {
    while (slotEls.length < size) {
      const index = slotEls.length;
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = "hotbar-slot";

      const indexEl = document.createElement("span");
      indexEl.className = "index";
      indexEl.textContent = String(index + 1);

      const blockEl = document.createElement("span");
      blockEl.className = "hotbar-block";
      blockEl.setAttribute("aria-hidden", "true");

      slot.append(indexEl, blockEl);
      root.append(slot);
      slotEls.push(slot);
    }

    while (slotEls.length > size) {
      const slot = slotEls.pop();
      slot.remove();
    }
  }

  return { render };
}

function toColor(rgb) {
  const r = clampChannel(rgb[0] * 255);
  const g = clampChannel(rgb[1] * 255);
  const b = clampChannel(rgb[2] * 255);
  return `rgb(${r} ${g} ${b})`;
}

function clampChannel(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(255, Math.round(value)));
}
