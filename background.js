// background.js - THE CORE ENGINE
// 1. INITIALIZATION
chrome.runtime.onInstalled.addListener(() => {
  // Set default state in local storage (persistent)
  chrome.storage.local.set({ 
    isActive: true, 
    lastSync: Date.now(),
    blockedCount: 0 
  });
  console.log("Billy Blocksi: Shield Primed.");
});

// 2. THE HEARTBEAT (Prevents the worker from dying during active sessions)
chrome.alarms.create("keepAlive", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepAlive") {
    // Perform a tiny task to let Chrome know we are still useful
    chrome.storage.local.get(["isActive"], (res) => {
      console.log("Billy Heartbeat. Active:", res.isActive);
    });
  }
});
// Function to update the blacklist from the Teacher Dashboard
async function applyTeacherBlock(newDomain) {
  const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
  const nextId = currentRules.length + 1;

  await chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [{
      "id": nextId,
      "priority": 1,
      "action": { "type": "block" },
      "condition": { "urlFilter": newDomain, "resourceTypes": ["main_frame"] }
    }],
    removeRuleIds: [] // You can also clear old rules here
  });
}
// 3. LISTEN FOR TEACHER EXTENSION COMMANDS
// This allows your separate Teacher Extension to 'talk' to this one
chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    // Security check: You'll eventually put your Teacher Extension ID here
    console.log("Billy Blocksi: Received command from external source", sender.id);

    if (request.action === "REMOTE_BLOCK") {
      applyTeacherBlock(request.domain);
      
      // Update stats for the UI
      chrome.storage.local.get(["blockedCount"], (res) => {
        chrome.storage.local.set({ blockedCount: (res.blockedCount || 0) + 1 });
      });

      sendResponse({ status: "Success", message: `Blocked ${request.domain}` });
    }
    return true; // Keeps the message channel open for async response
  }
);

// 4. TAB MONITORING (The 'Active' Filter)
// Unlike DNR which is silent, this allows you to log violations
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Logic for checking URL patterns in real-time if DNR misses them
    console.log("Billy checking active tab:", tab.url);
  }
});
// 1. Local Database of Blocked Words/Sites
const DEFAULT_BLACKLIST = ["game", "proxy", "bloxd.io", "unblocked"];

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["userBlacklist"], (res) => {
    if (!res.userBlacklist) {
      chrome.storage.local.set({ userBlacklist: DEFAULT_BLACKLIST });
    }
  });
  console.log("Billy Blocksi: Local Mode Active.");
});

// 2. Real-time URL Monitoring (Backup for DNR)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.storage.local.get(["userBlacklist"], (res) => {
      const list = res.userBlacklist || [];
      if (list.some(word => tab.url.toLowerCase().includes(word))) {
        // Force the tab to a local block page
        chrome.tabs.update(tabId, { url: chrome.runtime.getURL("blocked.html") });
      }
    });
  }
});
