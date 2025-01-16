chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'showNotification') {
    chrome.notifications.create({
      type: 'basic',
      title: request.title,
      message: request.message,
      iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    });
  }
});

chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.get(['premiumStatus', 'workoutStats'], function(result) {
    if (result.premiumStatus === undefined) {
      chrome.storage.sync.set({ premiumStatus: false });
    }
    if (result.workoutStats === undefined) {
      chrome.storage.sync.set({ workoutStats: {} });
    }
  });
});
