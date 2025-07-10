// Background script for LinkedIn CRM Checker
chrome.runtime.onInstalled.addListener(() => {
  console.log('LinkedIn CRM Checker extension installed');
});

// Listen for tab updates to enable/disable the extension icon
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isLinkedInProfile = tab.url.includes('linkedin.com/in/');
    
    // Update the extension icon/badge based on whether we're on a LinkedIn profile
    if (isLinkedInProfile) {
      chrome.action.setIcon({
        tabId: tabId,
        path: {
          16: "icons/icon16.png",
          48: "icons/icon48.png",
          128: "icons/icon128.png"
        }
      });
      chrome.action.enable(tabId);
    } else {
      chrome.action.setIcon({
        tabId: tabId,
        path: {
          16: "icons/icon16.png",
          48: "icons/icon48.png",
          128: "icons/icon128.png"
        }
      });
      chrome.action.disable(tabId);
    }
  }
}); 