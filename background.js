browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "the-one-and-only-item",
    title: "&2nd Search Engine",
    contexts: ["selection"],
  });
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  const {
    searchType,
    selectedEngine,
    independentUrl
  } = await browser.storage.local.get(null);
  if (searchType === "independent") {
    if (typeof independentUrl !== "string" || !independentUrl.includes("%s")) {
      browser.runtime.openOptionsPage();
    } else {
      browser.tabs.create({
        url: independentUrl.replace("%s", encodeURIComponent(info.selectionText))
      });
    }
  } else if (searchType === "installed") {
    const installedEngines = await browser.search.get();
    if (installedEngines.some(e => e.name === selectedEngine)) {
      browser.search.search({
        engine: selectedEngine,
        query: info.selectionText
      });
    } else {
      browser.runtime.openOptionsPage();
    }
  } else {
    browser.runtime.openOptionsPage();
  }
});