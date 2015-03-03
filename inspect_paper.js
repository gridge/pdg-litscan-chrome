// =============================================================================
// === Content script for inspecting paper metadata
// =============================================================================

// =============================================================================
// === APS Journals
// =============================================================================
var getAPSInfo = function() {    
    var paperInfo = {};
  
    //get DOI (useful for many things below)
    var t_doi = document.getElementsByClassName('doi');
    var journal_doi = "";
    var journal_doi_array = [];
    if (t_doi.length == 0) {
	console.log("Invalid DOI found: t_doi");
    } else {
	journal_doi = t_doi[0].innerText.substr(t_doi[0].innerText.lastIndexOf('/') + 1);
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
	paperInfo.author = journal_author[0].innerText;
	var idxComma = journal_author[0].innerText.indexOf(',');
	if (idxComma > 0)
	    //multiple author, keep the first one only
	    paperInfo.author = paperInfo.author.substr(0, idxComma);
	var idxEtAl = paperInfo.author.search('et al.');
	if (idxEtAl > 0) {
	    //cases where we have only one author and then "et al." (e.g. big collaborations)
	    //for those cases no comma was found.
	    paperInfo.author = paperInfo.author.substr(0, idxEtAl);
	}
	//now strip first name and trim
	paperInfo.author = paperInfo.author.substr(paperInfo.author.indexOf('.')+1).trim();
	paperInfo.author = paperInfo.author.toUpperCase();
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
    paperInfo.link = t_doi[0].innerText.substr(t_doi[0].innerText.indexOf(':')+1).trim();

   
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
    var allMetaFields = document.getElementsByTagName("META");
    for (var i=0; i < allMetaFields.length; i++) {
	if (paperInfo.journal == "" && allMetaFields[i].getAttribute("name")=="citation_journal_title") {
	    var journalName = allMetaFields[i].getAttribute("content");
	    if (journalName == "Journal of High Energy Physics") {paperInfo.journal = "JHEP";}
	} else 
	if (journal_doi == "" && allMetaFields[i].getAttribute("name")=="citation_doi") {
	    journal_doi = allMetaFields[i].getAttribute("content");
	} else if (journal_volume == "" && allMetaFields[i].getAttribute("name")=="citation_volume") {
	    journal_volume = allMetaFields[i].getAttribute("content");	    
	} else if (journal_issue == "" && allMetaFields[i].getAttribute("name")=="citation_issue") {
	    journal_issue = allMetaFields[i].getAttribute("content");
	} else if (paperInfo.author == "" && allMetaFields[i].getAttribute("name")=="citation_author") {
	    //important: only keep firs author! One meta tag per author is present.
	    paperInfo.author = allMetaFields[i].getAttribute("content");
	    var indexName = paperInfo.author.indexOf('.');
	    if (indexName < 0) {
		//assume no abbreviation in the name, strip first word
		indexName = paperInfo.author.indexOf(' ');
	    }
	    paperInfo.author = paperInfo.author.substr(indexName+1).trim();
	    paperInfo.author = paperInfo.author.toUpperCase();
	}
    } //end scalling meta-data

    //Journal -> done
    //Number
    paperInfo.number = String(parseInt(journal_volume) - 2000) + journal_issue;
    //Page
    paperInfo.page = journal_doi.substr(journal_doi.indexOf(')')+1);
    //Author -> done
    //Year
    paperInfo.year = journal_volume; //for Springer this field also gets the year
    //Link
    paperInfo.link = "http://dx.doi.org/"+journal_doi;


    return paperInfo;
};

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
    } else {
	console.log("No matching journal found for URL: "+document.URL);
    }
    console.log("Sending response:\n"+paperInfo);

    //send response to the caller
    sendResponse(paperInfo);
});
