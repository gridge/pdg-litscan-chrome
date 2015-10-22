// =============================================================================
// === Content script for inspecting paper metadata
// =============================================================================

// =============================================================================
// === Globals
// =============================================================================
// Timer for checking on dynamic content
var timerForDelayedLoad;

var getFirstAuthor = function(rawText) {
    var tmpAuthor = rawText;
    var idxComma = rawText.indexOf(',');
    if (idxComma > 0)
	//multiple author, keep the first one only
	tmpAuthor = tmpAuthor.substr(0, idxComma);
    var idxEtAl = tmpAuthor.search('et al.');
    if (idxEtAl > 0) {
	//cases where we have only one author and then "et al." (e.g. big collaborations)
	//for those cases no comma was found.
	tmpAuthor = tmpAuthor.substr(0, idxEtAl);
    }
    //now strip first name and trim
    var indexName = tmpAuthor.lastIndexOf('.');
    if (indexName < 0) {
	//assume no abbreviation in the name, strip first word
	indexName = tmpAuthor.indexOf(' ');
    }
    tmpAuthor = tmpAuthor.substr(indexName+1).trim();
    tmpAuthor = tmpAuthor.toUpperCase();

    return tmpAuthor;

};

// =============================================================================
// === APS Journals
// =============================================================================
var getAPSInfo = function() {    
    var paperInfo = {};

    //get DOI (useful for many things below)
    var t_doi = document.getElementsByClassName('doi-field');
    var journal_doi = "";
    var journal_doi_array = [];
    if (t_doi.length == 0) {
	console.log("Invalid DOI found: t_doi");
    } else {
	journal_doi = t_doi[0].value.substr(t_doi[0].value.lastIndexOf('/') + 1);
	journal_doi_array = journal_doi.split('.');
    }

    //--- Journal name
    var journal_suffix = "";
    if (journal_doi_array) {
	if (journal_doi_array[0] == "PhysRevLett")   {paperInfo.journal = "PRL";}
	else if (journal_doi_array[0] == "PhysRevD") {paperInfo.journal = "PR"; journal_suffix = "D";}
	else if (journal_doi_array[0] == "PhysRevC") {paperInfo.journal = "PR"; journal_suffix = "C";}
	else if (journal_doi_array[0] == "PhysRevX") {paperInfo.journal = "PR"; journal_suffix = "X";};
    } else {
	console.log("Potential problem with journal metadata. Journal not found in DOI. Aborting");
	return {};
    }

    //--- Journal issue/page
    if (journal_doi_array.length >= 2) {
	paperInfo.number = journal_suffix+journal_doi_array[1];
    }
    if (journal_doi_array.length >= 3)
	paperInfo.page = journal_doi_array[2];
    
    //--- Journal author
    var journal_author = document.getElementsByClassName("authors");
    if (journal_author.length > 0) {
	paperInfo.author = getFirstAuthor(journal_author[0].innerText);
    }

    //--- Journal year
    paperInfo.year = "";
    var allMetaFields = document.getElementsByTagName("META");
    for (var i=0; i < allMetaFields.length; i++) {
	if (allMetaFields[i].getAttribute("property")=="article:published_time") {
	    paperInfo.year = allMetaFields[i].getAttribute("content").substr(0,allMetaFields[i].getAttribute("content").indexOf('-'));
	}
    }

    //--- Journal link (removing 'DOI:')
    paperInfo.link = t_doi[0].value.trim();

   
    return paperInfo;
};

// =============================================================================
// === Springer Journals
// =============================================================================
var getSpringerInfo = function() {    
    var paperInfo = {};
    paperInfo.journal = "";
    paperInfo.number = "";
    paperInfo.page = "";
    paperInfo.author = "";
    paperInfo.year = "";
    paperInfo.particles = "";
    paperInfo.partProp = "";
    paperInfo.comment = "";
    paperInfo.link = "";

    var journal_doi = "";
    var journal_volume="";
    var journal_issue="";
    var journalSuffix="";
    var journalDate="";
    var allMetaFields = document.getElementsByTagName("META");
    for (var i=0; i < allMetaFields.length; i++) {
	if (paperInfo.journal == "" && allMetaFields[i].getAttribute("name")=="citation_journal_title") {
	    var journalName = allMetaFields[i].getAttribute("content");
	    if (journalName == "Journal of High Energy Physics") {paperInfo.journal = "JHEP";}
	    else if (journalName == "The European Physical Journal A") {paperInfo.journal = "EPJ";journalSuffix="A";}
	    else if (journalName == "The European Physical Journal C") {paperInfo.journal = "EPJ";journalSuffix="C";}
	    
	} else 
	if (journal_doi == "" && allMetaFields[i].getAttribute("name")=="citation_doi") {
	    journal_doi = allMetaFields[i].getAttribute("content");
	} else if (journal_volume == "" && allMetaFields[i].getAttribute("name")=="citation_volume") {
	    journal_volume = allMetaFields[i].getAttribute("content");	    
	} else if (journal_issue == "" && allMetaFields[i].getAttribute("name")=="citation_issue") {
	    journal_issue = allMetaFields[i].getAttribute("content");
	} else if (paperInfo.author == "" && allMetaFields[i].getAttribute("name")=="citation_author") {
	    //important: only keep firs author! One meta tag per author is present.
	    paperInfo.author = getFirstAuthor(allMetaFields[i].getAttribute("content"));
	} else if (journalDate == "" && allMetaFields[i].getAttribute("name")=="citation_online_date") {
	    journalDate = allMetaFields[i].getAttribute("content");
	}
    } //end scalling meta-data

    //Journal -> done
    //Number, Page, Year
    if (paperInfo.journal == "JHEP") {
	var journalNumber = String(parseInt(journal_volume) - 2000);
	if (journal_issue.length == 1) journal_issue = "0"+journal_issue;
	paperInfo.number = journalSuffix+journalNumber + journal_issue;
	paperInfo.page = journal_doi.substr(journal_doi.indexOf(')')+1);
	while (paperInfo.page.length < 3) paperInfo.page = "0" + paperInfo.page;
    } else if ( (paperInfo.journal == "EPJ") && journalSuffix == "A") {
	paperInfo.number = journalSuffix+journal_volume;
	var tmpPage = journal_doi.substr(journal_doi.lastIndexOf('/')+1);
	tmpPage = tmpPage.split('-')[1];
	paperInfo.page = tmpPage.substr(2); //skip first two digits
	paperInfo.year = String(parseInt(tmpPage.substr(0, 2))+2000);
    } else if ( (paperInfo.journal == "EPJ") && journalSuffix == "C") {
	paperInfo.number = journalSuffix+journal_volume;
	//for the page we need to query another element, unfortunately
	var t_VolPage = document.getElementsByClassName("ArticleCitation_Volume");
	if (t_VolPage && t_VolPage.length > 0) {
	    paperInfo.page = t_VolPage[0].innerText.substr(t_VolPage[0].innerText.indexOf(':')+1);
	}	
	paperInfo.year = journalDate.substr(0, journalDate.indexOf('/'));
    }
    
    //Author -> done
    //Link
    paperInfo.link = "http://dx.doi.org/"+journal_doi;


    return paperInfo;
};


// =============================================================================
// === Science Direct
// =============================================================================

var checkDynamicContentScienceDirect = function() {
    //first check if the last dynamic content we need was loaded
    if (!document.getElementsByClassName("authorName S_C_authorName svAuthor")) return;
    
    //ok, clear timer
    clearInterval( timerForDelayedLoad );

    //and fill relevant info
    console.log("Content loaded. Parsing information.");
    var paperInfo = {};
    paperInfo.journal = "";
    paperInfo.number = "";
    paperInfo.page = "";
    paperInfo.author = "";
    paperInfo.year = "";
    paperInfo.particles = "";
    paperInfo.partProp = "";
    paperInfo.comment = "";
    paperInfo.link = "";

    var t_journal = document.getElementsByClassName("title");
    var journalPostfix = "";
    if (t_journal) {
	//it's not the first one, brute force
	for (var idx=0; idx < t_journal.length; idx++) {
	    var journalName = t_journal[idx].innerText;
	    //console.log("Inspecting: "+journalName);
	    if (journalName == "Physics Letters B") {
		paperInfo.journal = "PL"; //will edit afterwards
		journalPostfix = "B";
		break; //found it!
	    }
	    //@todo here check other ScienceDirect journal names
	}
    }

    var t_volIssue = document.getElementsByClassName("volIssue");
    if (t_volIssue) {
	var volIssueTxt = t_volIssue[0].innerText.split(',');

	paperInfo.number = journalPostfix+volIssueTxt[0].substr(volIssueTxt[0].indexOf(' ')+1);

	var tmpPage = volIssueTxt[2].trim(); //e.g. 'Pages 79-81'
	tmpPage = tmpPage.substr(tmpPage.indexOf(' ')+1);
	paperInfo.page = tmpPage.substr(0, tmpPage.indexOf('–'));

	var tmpYear = volIssueTxt[1].trim(); //e.g. '9 April 2015'
	paperInfo.year = tmpYear.substr(tmpYear.lastIndexOf(' ')+1);
    }

//    var t_author = document.getElementsByClassName("authorName S_C_authorName svAuthor");
    var t_author = document.getElementsByClassName("authorName");
    if (t_author) {
	//get first one only
	//console.log("Inspecting: "+t_author[0]);
	paperInfo.author = getFirstAuthor(t_author[0].innerText);
    }

    var t_doi = document.getElementsByClassName("doiLink");
    if (t_doi) {
	var tmpLink = t_doi[0].innerText;
	tmpLink = tmpLink.substr(tmpLink.indexOf(':')+1);
	paperInfo.link = "http://dx.doi.org/"+tmpLink;
    } else {
	paperInfo.link = document.URL;
    }

    //make final message and send it
    var delayedInfoToSend = {};
    delayedInfoToSend.message = "PDGLit_DetailedInfo";
    delayedInfoToSend.paperInfo = paperInfo;

    //debug:
    console.log("Summary of dynamic info collected:");
    console.log("Journal: "+paperInfo.journal);
    console.log("Number: "+paperInfo.number);
    console.log("Page: "+paperInfo.page);
    console.log("Author: "+paperInfo.author);
    console.log("Year: "+paperInfo.year);
    console.log("Link: "+paperInfo.link);

    chrome.runtime.sendMessage(delayedInfoToSend);
}

// =============================================================================
// === Main routine
// =============================================================================
chrome.runtime.onMessage.addListener( function (message, sender, sendResponse) {
    console.log("Message from '"+sender+"': " + message);    
    if (message != "PDGLit_Inspect") return; //nothing for me to do

    //output object to be filled by the journal-specific routines
    var paperInfo = {};
    paperInfo.journal = "";
    paperInfo.number = "";
    paperInfo.page = "";
    paperInfo.author = "";
    paperInfo.year = "";
    paperInfo.particles = "";
    paperInfo.partProp = "";
    paperInfo.comment = "";
    paperInfo.link = "";

    //now check what URL pattern we're scanning and call appropriate function
    if (document.URL.match(/journals.aps.org\/pr.+\/abstract\//)) {
	paperInfo = getAPSInfo();
    } else if (document.URL.match(/link.springer.com\/article\//)) {
	paperInfo = getSpringerInfo();
    } else if (document.URL.match(/www.sciencedirect.com\/science\/article\/pii\//)) {
	//ScienceDirect loads all the info dynamically. Need to wait for them to appear.
	console.log("All dynamic content. Setting a delayed response.");
	timerForDelayedLoad = setInterval ( checkDynamicContentScienceDirect, 500);
    } else {
	console.log("No matching journal found for URL: "+document.URL);
    }
    console.log("Sending response:\n"+paperInfo);

    //send response to the caller
    sendResponse(paperInfo);
});
