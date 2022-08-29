// src/background.ts
chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["dist/devbook.js"]
  });
});
//# sourceMappingURL=background.mjs.map
