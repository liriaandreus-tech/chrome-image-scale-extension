(() => {
  if (globalThis.imageScaleViewerLoaded) return;
  globalThis.imageScaleViewerLoaded = true;
  let lastTarget = null;
  let panel = null;
  let panelOpen = false;

  document.addEventListener("contextmenu", event => {
    lastTarget = event.composedPath().find(node => node instanceof HTMLImageElement) || null;
  }, true);

  function closePanel() {
    panel?.remove();
    panel = null;
  }

  document.addEventListener("pointerdown", event => {
    if (!panelOpen || (panel && event.composedPath().includes(panel))) return;
    panelOpen = false;
    closePanel();
    chrome.runtime.sendMessage({ type: "DISMISS_IMAGE_SCALE" }).catch(() => {});
  }, true);

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape" || !panelOpen) return;
    panelOpen = false;
    closePanel();
    chrome.runtime.sendMessage({ type: "DISMISS_IMAGE_SCALE" }).catch(() => {});
  }, true);

  window.addEventListener("blur", () => {
    if (!panelOpen) return;
    panelOpen = false;
    closePanel();
    chrome.runtime.sendMessage({ type: "DISMISS_IMAGE_SCALE" }).catch(() => {});
  });

  function greatestCommonDivisor(a, b) {
    while (b) [a, b] = [b, a % b];
    return a;
  }

  function inferFormat(url) {
    try {
      const match = new URL(url).pathname.match(/\.([a-z0-9]+)$/i);
      const names = { jpg: "JPEG", jpeg: "JPEG", png: "PNG", webp: "WebP", gif: "GIF", svg: "SVG", avif: "AVIF", bmp: "BMP", ico: "ICO" };
      return match && names[match[1].toLowerCase()] || "Não identificado";
    } catch {
      return "Não identificado";
    }
  }

  function showPanel(imageUrl, css) {
    closePanel();
    let target = lastTarget;
    lastTarget = null;
    if (!target?.isConnected || (target.currentSrc !== imageUrl && target.src !== imageUrl)) {
      const matches = [...document.querySelectorAll("img")].filter(img => img.currentSrc === imageUrl || img.src === imageUrl);
      target = matches.length === 1 ? matches[0] : null;
    }

    const host = document.createElement("div");
    host.style.cssText = "all: initial; position: fixed; top: 20px; right: 20px; z-index: 2147483647;";
    const shadow = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = css;
    const wrapper = document.createElement("div");
    wrapper.className = "isv-info-panel";
    wrapper.innerHTML = `
      <header class="isv-header">
        <h3 class="isv-title">Escala da imagem</h3>
        <button class="isv-close" type="button" aria-label="Fechar">×</button>
      </header>
      <section class="isv-measure">
        <div class="isv-label">Dimensões naturais</div>
        <div class="isv-size"></div>
      </section>
      <section class="isv-ratio-section" hidden>
        <div>
          <div class="isv-label isv-label-strong">Proporção</div>
          <div class="isv-ratio"></div>
        </div>
        <div class="isv-orientation"></div>
      </section>
      <div class="isv-actions"></div>
      <div class="isv-details"></div>
      <div class="isv-url"></div>
      <div class="isv-status" role="status" aria-live="polite"></div>
      <footer class="isv-footer">Clique fora ou pressione Esc para fechar</footer>`;
    shadow.append(style, wrapper);
    document.documentElement.append(host);
    panel = host;

    const size = wrapper.querySelector(".isv-size");
    const ratioSection = wrapper.querySelector(".isv-ratio-section");
    const actions = wrapper.querySelector(".isv-actions");
    const details = wrapper.querySelector(".isv-details");
    const status = wrapper.querySelector(".isv-status");
    wrapper.querySelector(".isv-close").addEventListener("click", () => {
      panelOpen = false;
      closePanel();
      chrome.runtime.sendMessage({ type: "DISMISS_IMAGE_SCALE" }).catch(() => {});
    });

    function row(label, value) {
      const line = document.createElement("div");
      line.className = "isv-detail-row";
      const name = document.createElement("span");
      const text = document.createElement("span");
      name.textContent = label;
      text.textContent = value;
      line.append(name, text);
      details.append(line);
    }

    function copyButton(label, value) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "isv-copy";
      button.textContent = label;
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(value);
          status.textContent = "Copiado!";
        } catch {
          status.textContent = "Não foi possível copiar. Selecione o valor e copie manualmente.";
        }
      });
      actions.append(button);
    }

    const width = target?.naturalWidth || 0;
    const height = target?.naturalHeight || 0;
    if (width && height) {
      const divisor = greatestCommonDivisor(width, height);
      const ratio = `${width / divisor}:${height / divisor}`;
      size.textContent = `${width} × ${height} px`;
      ratioSection.hidden = false;
      wrapper.querySelector(".isv-ratio").textContent = ratio;
      wrapper.querySelector(".isv-orientation").textContent =
        width === height ? "Quadrada" : width > height ? "Horizontal" : "Vertical";
      copyButton("Copiar dimensões", `${width} × ${height}`);
      copyButton("Copiar proporção", ratio);
      const renderedWidth = target.offsetWidth;
      const renderedHeight = target.offsetHeight;
      if (renderedWidth && renderedHeight) {
        row("Na página (caixa CSS)", `${renderedWidth} × ${renderedHeight} px`);
        row("Escala horizontal / vertical",
          `${Math.round(renderedWidth / width * 100)}% / ${Math.round(renderedHeight / height * 100)}%`);
      }
    } else {
      size.classList.add("isv-unavailable");
      size.textContent = "Não foi possível identificar a imagem selecionada.";
      status.textContent = "Recarregue a página e tente novamente.";
    }
    row("Formato pelo endereço", inferFormat(imageUrl));
    const url = wrapper.querySelector(".isv-url");
    const urlLabel = document.createElement("span");
    const urlValue = document.createElement("span");
    urlLabel.textContent = "Endereço da imagem";
    urlValue.textContent = imageUrl.length > 100 ? imageUrl.slice(0, 60) + "…" : imageUrl;
    url.append(urlLabel, urlValue);
  }

  chrome.runtime.onMessage.addListener((message, sender) => {
    if (sender.id !== chrome.runtime.id) return;
    if (message?.type === "CLOSE_IMAGE_SCALE") { panelOpen = false; closePanel(); }
    if (message?.type === "IMAGE_SCALE_OPENED") panelOpen = true;
    if (message?.type === "SHOW_IMAGE_SCALE") showPanel(message.imageUrl, message.css);
  });
})();
