// =============================================================================
// === Background page controller script
// =============================================================================

// Setup context menu
chrome.runtime.onInstalled.addListener(function() {
    var context = "page";
    var title = "Add to PDG";
    var id = chrome.contextMenus.create({"title": title, "contexts":[context], "id": "context" + context});
});

// add click event
chrome.contextMenus.onClicked.addListener(onClickHandler);

// The onClicked callback function.
function onClickHandler(info, tab) {
    var url = "pdg_insert_paper.html";
    //window.open(url, '_blank',"menubar=0,location=0,status=0,titlebar=0,toolbar=0");
    chrome.windows.create({ url: url, type: 'popup', width: 315, height: 500});
};

