// =============================================================================
// === Background page controller script
// =============================================================================

// --- Setup context menu
chrome.runtime.onInstalled.addListener(function() {
    var context = "page";
    var title = "Add to PDG";
    var id = chrome.contextMenus.create({"title": title, "contexts":[context], "id": "context" + context});
});

// Add click event
function onClickHandler(info, tab) {
    //Call the popup as new window, passing as argument the id of previous window as reference
    chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {    
	var url = "pdg_insert_paper.html#"+tabs[0].id;
	chrome.windows.create({ url: url, type: 'popup', width: 400, height: 610});
    });
};
chrome.contextMenus.onClicked.addListener(onClickHandler);

