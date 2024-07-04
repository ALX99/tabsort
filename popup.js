document.addEventListener('DOMContentLoaded', function() {
  const tabsContainer = document.getElementById('tabsContainer');

  // Function to create a list item for each tab
  function createTabItem(tab) {
    const li = document.createElement('li');
    const tabTitle = document.createElement('span');
    tabTitle.className = 'tab-title';
    tabTitle.textContent = tab.title;

    const button = document.createElement('button');
    button.textContent = 'Close';
    button.addEventListener('click', function() {
      chrome.tabs.remove(tab.id);
      li.remove();
    });

    li.appendChild(tabTitle);
    li.appendChild(button);
    return li;
  }

  function groupTabsByHostname(tabs) {
    return tabs.reduce((groups, tab) => {
      const hostname = new URL(tab.url).hostname;

      if (!groups[hostname]) groups[hostname] = [];

      groups[hostname].push(tab);
      return groups;
    }, {});
  }

  // Get all open tabs and create a list item for each
  chrome.tabs.query({}, function(tabs) {
    const groupedTabs = groupTabsByHostname(tabs);

    for (const hostname in groupedTabs) {
      const group = groupedTabs[hostname];

      const h2 = document.createElement('h2');
      h2.textContent = hostname;
      tabsContainer.appendChild(h2);

      const ul = document.createElement('ul');
      group.forEach(tab => {
        ul.appendChild(createTabItem(tab));
      });
      tabsContainer.appendChild(ul);
    }
  });
});
