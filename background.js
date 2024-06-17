let TOGGLE_AUTO_GROUP_ID = "toggleAutoGroup";
let debounceTimeout;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get({ autoGroupTabs: false }, (data) => {
    chrome.storage.sync.set({ autoGroupTabs: data.autoGroupTabs });

    chrome.contextMenus.create({
      id: TOGGLE_AUTO_GROUP_ID,
      title: "Automatically group tabs",
      type: "checkbox",
      checked: data.autoGroupTabs,
      contexts: ["all"]
    });
  });
});


chrome.contextMenus.onClicked.addListener((info, _) => {
  if (info.menuItemId !== TOGGLE_AUTO_GROUP_ID)
    return;

  chrome.storage.sync.get('autoGroupTabs', (data) => {
    const newValue = !data.autoGroupTabs;
    chrome.storage.sync.set({ autoGroupTabs: newValue }, () => {
      chrome.contextMenus.update(TOGGLE_AUTO_GROUP_ID, { checked: newValue });
      console.log('Auto Group Tabs is now', newValue);
    });
  });
});

chrome.action.onClicked.addListener(() => { sortTabs(); });

chrome.tabs.onUpdated.addListener(() => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    chrome.storage.sync.get('autoGroupTabs', (data) => {
      if (!data.autoGroupTabs) return;
      sortTabs();
    });
  }, 500);
});


function sortTabs() {
  chrome.tabs.query({}, (tabs) => {
    let highlightedName = "";
    const tabGroups = tabs.reduce((groups, tab) => {
      let name = tab.url;
      try {
        name = new URL(tab.url).hostname.replace(/^www\./, '');
      } catch (ex) {
        console.log("invalid url", name, ex);
      }

      if (tab.highlighted) highlightedName = name;

      if (!groups[name]) groups[name] = [];
      groups[name].push(tab.id);
      return groups;
    }, {});

    chrome.tabGroups.query({}, (groups) => {
      Object.keys(tabGroups).forEach((hostname) => {
        const tabIds = tabGroups[hostname];

        if (tabIds.length <= 1) {
          chrome.tabs.ungroup(tabIds);
          chrome.tabs.move(tabIds, { index: -1 });
          return;
        }

        const existingGroup = groups.find(g => g.title === hostname);
        const groupId = existingGroup ? existingGroup.id : undefined;

        chrome.tabs.group({ groupId, tabIds }, (newGroupId) => {
          chrome.tabGroups.update(newGroupId, { collapsed: hostname != highlightedName, title: hostname });
        });
      });
    });
  });
}
