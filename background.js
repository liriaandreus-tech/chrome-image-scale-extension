chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "image-scale-viewer",
    title: "Ver escala da imagem",
    contexts: ["image"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "image-scale-viewer" || !info.srcUrl || tab?.id == null) return;

  const frameId = info.frameId ?? 0;
  try {
    const css = await fetch(chrome.runtime.getURL("content.css")).then(response => {
      if (!response.ok) throw new Error("Não foi possível carregar os estilos.");
      return response.text();
    });
    await chrome.tabs.sendMessage(tab.id, { type: "CLOSE_IMAGE_SCALE" }).catch(() => {});
    try {
      await chrome.tabs.sendMessage(tab.id, { type: "SHOW_IMAGE_SCALE", imageUrl: info.srcUrl, css }, { frameId });
    } catch {
      // A tab opened before the extension was installed may not have its content script.
      await chrome.scripting.executeScript({ target: { tabId: tab.id, frameIds: [frameId] }, files: ["content.js"] });
      await chrome.tabs.sendMessage(tab.id, { type: "SHOW_IMAGE_SCALE", imageUrl: info.srcUrl, css }, { frameId });
    }
    await chrome.tabs.sendMessage(tab.id, { type: "IMAGE_SCALE_OPENED" }).catch(() => {});
  } catch (error) {
    console.warn("Image Scale Viewer: não foi possível abrir o painel.", error);
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (sender.id !== chrome.runtime.id || message?.type !== "DISMISS_IMAGE_SCALE" || sender.tab?.id == null) return;
  chrome.tabs.sendMessage(sender.tab.id, { type: "CLOSE_IMAGE_SCALE" }).catch(() => {});
});
