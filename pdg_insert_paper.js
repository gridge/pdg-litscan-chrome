// =============================================================================
// === Manage the status of the pdg_insert_page.html form
// =============================================================================

"use strict";

/** Settings
 * Info on spreadsheet using
 * Key from URL: 'https://docs.google.com/spreadsheets/d/[KEY]/edit#gid=0'
 * Sheet ID from spreadheet info with 'https://spreadsheets.google.com/feeds/worksheets/[KEY]/private/basic'\
 * look for <id> fields [also contains, <title> & other info on the spreadsheet, including protocol to use]
 * (append '?alt=json' for JSON format)
 * http://blog.ouseful.info/2011/09/07/google-spreadsheets-api-listing-individual-spreadsheet-sheets-in-r/
 * @{ */

/// Spreadsheet key to append new information
var gSpreadsheet_key = '1NnneKRwXHpOJn-3Em9c2o0eZBSzfcDm0Jxd7VKiMYq4';
/// Spreadsheet sheet to use insde gSpreadsheet_key spreadhseet
var gSpreadsheet_sheet = 'od6';

/** @} */

/** List of permitted states of the extension.
* @{ */

// Pre-init stage
var STATE_PREINIT=0;
// Startup (no authentication)
var STATE_START=1;
// Ready (no authentication)
var STATE_READY_NOAUTH=2;
// Ready (authenticated)
var STATE_READY=3;
// Authenticating
var STATE_ACQUIRING_AUTHTOKEN=10;
// Submitting reference
var STATE_SUBMITTING=20;

/** Global variable keeping the status of the extension.
* @type {int}
*/
var STATUS = STATE_PREINIT;

/** @} */

/** Return code and errors
* @{
*/
var LastError=RET_OK;
var RET_OK=0;
var RET_AUTH_ERROR=10;
var RET_SUB_ERROR=20;

/** @} */

/** Fields of HTNL form requiring interaction
* @{
*/
// Buttons (sign-in, submit)
var b_signin, b_submitref, b_copyref, b_clear;
// Login user
var l_loginuser, d_login;
// Status bar
var l_status;

/** @} */

/** Authenticated username (empty = None) */
var userNameAuth;

/** Input fields. 
* @{
*/

var t_journal;
var t_number;
var t_page;

var t_author;
var t_year;

var t_particles;
var t_partProp;

var t_comment;

var createInputRecord = function() {
    this.journal = t_journal.value;
    this.number = t_number.value;
    this.page = t_page.value;
    this.author = t_author.value;
    this.year = t_year.value;
    this.particles = t_particles.value;
    this.partProp = t_partProp.value;
    this.comment = t_comment.value;
};

/** @} */

var statusMgr = new function() {

    this.logDebug = function(message) {
	console.log(message);
    };

    this.log = function(message) {
	l_status.innerHTML = message;
	this.logDebug(message); //also print to console
    };

    /// Lock/Unlock all input fields
    var lockInputFields = function(lock) {
	t_journal.disabled=lock;
	t_number.disabled=lock;
	t_page.disabled=lock;
	t_author.disabled=lock;
	t_year.disabled=lock;
	t_particles.disabled=lock;
	t_partProp.disabled=lock;
	t_comment.disabled=lock;
    };

    var clearInputFields = function() {
	t_journal.value='';
	t_number.value='';
	t_page.value='';
	t_author.value='';
	t_year.value='';
	t_particles.value='';
	t_partProp.value='';
	t_comment.value='';
    };

    this.setUser = function(user) {
	if ( user && (user.length > 0) ) {
	    //valid user provided
	    l_loginuser.innerHTML = user;
	    userNameAuth = user;
	    console.log("Changed user: "+userNameAuth);	
	} else {
	    //empty user -> log off
	    l_loginuser.innerHTML = 'None';
	    userNameAuth = '';
	    console.log('Cleared logged in user.');
	}
    };

    this.setUserPic = function(pic) {
	//@todo: add picture to the login_div element, if not already there
	// see also example in idetity code (see below url)
    };
    
    /// Change status of extension
    this.changeState = function(newState) {
	STATUS = newState;
	console.log('Switching to state: ' + newState);
	switch (STATUS) {
	    case STATE_START:	       
	       lockInputFields(true);
	       b_signin.disabled=false;
	       b_signin.innerHTML='Sign in';
	       b_submitref.disabled=true;
	       b_copyref.disabled=true;
	       l_loginuser.innerHTML='None';	    
	       statusMgr.log('Started.');
	       break;
	    case STATE_READY_NOAUTH:
	       lockInputFields(false); //allows copy-to-clipboard if submit
	       b_signin.disabled=false;
	       b_signin.innerHTML='Sign in';
	       b_submitref.disabled=true;
	       b_copyref.disabled=false;
	       l_loginuser.innerHTML='None';	    
	       statusMgr.log('Ready, but not authenticated (clipboard will be used).');
	       break;
	    case STATE_READY:
	       console.log('Entering READY for user: '+userNameAuth);
	       console.log('Adjusting visible elements');
	       lockInputFields(false);
	       b_signin.disabled=false;	      
	       b_signin.innerHTML='Sign out';
	       b_submitref.disabled=false;
	       b_copyref.disabled=false;
	       statusMgr.log("Ready. User Authenticated.");	    
	       break;
	    case STATE_ACQUIRING_AUTHTOKEN:
	       lockInputFields(true);
	       b_signin.disabled=true;
	       b_submitref.disabled=true;
	       b_copyref.disabled=true;
	       statusMgr.log("Authenticating..");	    
	       break;
	    case STATE_SUBMITTING:
	       lockInputFields(true);
	       b_signin.disabled=true;
	       b_submitref.disabled=true;
	       b_copyref.disabled=true;
	       statusMgr.log("Submitting..");	    
	       break;	    
	};
    };

    this.connectFields = function() {

	b_signin = document.getElementById('login');
	b_signin.addEventListener('click', statusMgr.onLogin);

	b_submitref = document.getElementById('submitref');
	b_submitref.addEventListener('click', statusMgr.onSubmitRef);

	b_copyref = document.getElementById('submitToClipboard');
	b_copyref.addEventListener('click', statusMgr.onCopyRef);

	b_clear = document.getElementById('clearFields');
	b_clear.addEventListener('click', statusMgr.clearInputFields);

	l_loginuser = document.getElementById('loginname');
	d_login = document.getElementById('login_div');

	l_status = document.getElementById('status');

	//now connect fields
	t_journal = document.getElementById('journal');
	t_number = document.getElementById('number');
	t_page = document.getElementById('page');

	t_author = document.getElementById('author');
	t_year = document.getElementById('year');

	t_particles = document.getElementById('particles');
	t_partProp = document.getElementById('partprop');

	t_comment = document.getElementById('comment');

	//update status
	this.changeState(STATE_READY_NOAUTH);
    };

    // Handles submit reference button 'click' event
    this.onSubmitRef = function() {
	//Submit with authenticated user
	statusMgr.log('Submission in progress...');
	gSpreadSheetMgr.submitRef(new createInputRecord());
	//clearInputFields();
    };

    this.onCopyRef = function() {
	//No login done. Using clipboard
	statusMgr.log('Copying data to clipboard');
	clipboardMgr.submitRef(new createInputRecord());
	//clearInputFields();
    };

    // Handles Login button 'click' event
    this.onLogin = function() {
	if (STATUS==STATE_READY) {
	    //this is a logout
	    statusMgr.log('Logout in progress..');
	    loginMgr.logout();
	    statusMgr.changeState(STATE_READY_NOAUTH);
	} else if (STATUS==STATE_READY_NOAUTH) {
	    //this is a login
	    statusMgr.log('Login in progress..');
	    loginMgr.login(true);
	} else {
	    statusMgr.log('Invalid status for Login. Should never happen.');
	}
    };

    
};

// =============================================================================
// === Manage the google account login/logout
// Heavily taken from
// https://github.com/GoogleChrome/chrome-app-samples/blob/master/samples/identity/
// Required methods (dependencies) for any login interface:
// - login(interactive) -> if interactive=false, just attempt auto-login
// - logout()
// - xhrWithAuth(method, url, interactive, callback) [for spreadsheet]
// =============================================================================
var loginMgr = new function () {
    // Method for making XML HTTP Requests with access token
    this.xhrWithAuth = function(method, url, content, contentType, interactive, callback) {
	var access_token;
	var retry = true;

	console.log('XML Http request; interactive='+interactive+'; method='+method+';url='+url);
	getToken();

	function getToken() {
	    statusMgr.changeState(STATE_ACQUIRING_AUTHTOKEN);
	    console.log('Acquiring token');
	    chrome.identity.getAuthToken({ interactive: interactive }, function(token) {
		console.log('Callback of auth token entered.');
		if (chrome.runtime.lastError) {
		    statusMgr.log(chrome.runtime.lastError);
		    callback(chrome.runtime.lastError);
		    return;
		}
		
		access_token = token;
		console.log('Token retrieved.');
		requestStart();
	    });
	}

	function requestStart() {
	    console.log('Preparing XML Http request.');
	    var xhr = new XMLHttpRequest();
	    xhr.open(method, url);
	    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
	    xhr.onload = requestComplete;
	    if (contentType != '') {
		xhr.setRequestHeader("Content-type", contentType);
	    }
	    if (method == 'GET') {
		xhr.send();
	    } else {
		xhr.send(content);
	    }
	}

	function requestComplete() {
	    console.log('Request completed.');
	    if (this.status == 401 && retry) {
		console.log('Request failed. Revoking token and retrying.');
		retry = false;
		chrome.identity.removeCachedAuthToken({ token: access_token },
						      getToken);
	    } else {
		console.log('Request completed. status='+this.status+';response='+this.response);
		callback(null, this.status, this.response);
	    }
	}
    };

    // Get information about user (if already logged in), using chrome identity
    this.getUserInfo_chrome = function(interactive) {
	var access_token;
	console.log('Getting user info (chrome auth). Interactive login = '+interactive);

	statusMgr.changeState(STATE_ACQUIRING_AUTHTOKEN);
	console.log('Acquiring token');
	//@todo: add timeout?
	chrome.identity.getAuthToken({ interactive: interactive }, function(token) {
	    console.log('Callback of auth token entered.');
	    if (chrome.runtime.lastError) {
		statusMgr.changeState(STATE_READY_NOAUTH);
		statusMgr.log(chrome.runtime.lastError.message);
		return RET_AUTH_ERROR;
	    }		
	    access_token = token;
	    console.log('Token retrieved.');
	    //now get user information
	    statusMgr.log('Acquiring user information...');
	    chrome.identity.getProfileUserInfo( function(userInfo) {
		console.log('User information received.');
		if (userInfo.id && (userInfo.id.length > 0)) {
		    console.log('User info object:');
		    console.log(userInfo);
		    console.log('Updating user information.');
		    if (userInfo.email && (userInfo.email.length > 0)) {
			console.log('Valid email found.');
			statusMgr.setUser(userInfo.email);
		    } else {
			console.log('Invalid email found, using user Id.');
			statusMgr.setUser(userInfo.id);
		    }
		    statusMgr.changeState(STATE_READY);
		} else {
		    statusMgr.changeState(STATE_READY_NOAUTH);
		    statusMgr.log("Failed user Authentication (empty id returned).");		    
		}
	    }
	    );
	    return RET_OK;
	});

    };
    
    // Get information about user (if already logged in) using xml http request
    this.getUserInfo_gplus = function(interactive) {
	console.log('Getting user info (google+ auth). Interactive login = '+interactive);
	statusMgr.changeState(STATE_ACQUIRING_AUTHTOKEN);
	this.xhrWithAuth('GET',
			 'https://www.googleapis.com/plus/v1/people/me',			 
			 '', '', 
			 interactive,
			 onUserInfoFetched);

	//Callback on user info acquired
	var onUserInfoFetched = function(error, status, response) {
	    console.log('User information received.');
	    if (!error && status == 200) {
		console.log(response);
		var user_info = JSON.parse(response);
		populateUserInfo(user_info);
		statusMgr.changeState(STATE_READY);
	    } else {	    
		statusMgr.changeState(STATE_READY_NOAUTH);
		statusMgr.log("Failed user Authentication.");
	    }	
	};
	
	var populateUserInfo = function(user_info) {
	    logDebug('Updating user information.');
	    statusMgr.setUser(user_info.displayName);
	    //@todo: can also fetch user image: user_info.image.url
	    // see function fetchImageBytes(user_info) 
	    // [from URL of identity example above]
	};
	
    };


    this.login = function(interactive) {
	console.log('Login requested; interactive = '+interactive);
	statusMgr.changeState(STATE_ACQUIRING_AUTHTOKEN);

	if (interactive) {
	    // @description This is the normal flow for authentication/authorization
	    // on Google properties. You need to add the oauth2 client_id and scopes
	    // to the app manifest. The interactive param indicates if a new window
	    // will be opened when the user is not yet authenticated or not.
	    // @see http://developer.chrome.com/apps/app_identity.html
	    // @see http://developer.chrome.com/apps/identity.html#method-getAuthToken
	    console.log('Requesting token in interactive mode.');
	    chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
		if (chrome.runtime.lastError) {
		    console.log('Error in authentication. See message below.');
		    console.log(chrome.runtime.lastError);
		    statusMgr.changeState(STATE_READY_NOAUTH);
		    statusMgr.log(chrome.runtime.lastError);
		} else {
		    console.log('Token acquired:'+token+
			     '. See chrome://identity-internals for details.');
		    statusMgr.changeState(STATE_READY);
		}
	    });
	}

	// @description get user info (if interactive is false, silent login if possible)
	this.getUserInfo_chrome(interactive);
	
    };

    this.logout = function() {
	statusMgr.setUser('');
	chrome.identity.getAuthToken({ 'interactive': false },
	  function(current_token) {
	      if (!chrome.runtime.lastError) {
		  
		  // @corecode_begin removeAndRevokeAuthToken
		  // @corecode_begin removeCachedAuthToken
		  // Remove the local cached token
		  chrome.identity.removeCachedAuthToken({ token: current_token },
							function() {});
		  // @corecode_end removeCachedAuthToken
		  
		  // Make a request to revoke token in the server
		  var xhr = new XMLHttpRequest();
		  xhr.open('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' +
			   current_token);
		  xhr.send();
		  // @corecode_end removeAndRevokeAuthToken
		  
		  // Update the user interface accordingly
		  console.log('Token revoked and removed from cache. '+
				     'Check chrome://identity-internals to confirm.');
		  statusMgr.log('Logged out successfully.');
              }
	  });
    };
    
}; //end of loginMgr

// =============================================================================
// === Submit form results to google spreadsheet
// =============================================================================
var gSpreadSheetMgr = new function () {
    this.constructAtom = function(inputRecord) {
	var atomStr = "<?xml version='1.0' encoding='UTF-8'?>" + "\n";
	
	atomStr += '<entry xmlns="http://www.w3.org/2005/Atom" ' + "\n";
	atomStr += 'xmlns:gsx="http://schemas.google.com/spreadsheets/2006/extended">' + "\n"

	var addCol = function(title, value) {
	    return '<gsx:'+title+'>'+value+'</gsx:'+title+'>' + "\n";
	};
	
	atomStr += addCol('journalreference', inputRecord.journal + ' ' + inputRecord.number + ' ' + inputRecord.page);
	atomStr += addCol('author', inputRecord.author);
	atomStr += addCol('year', inputRecord.year);
	atomStr += addCol('particles', inputRecord.particles);
	atomStr += addCol('property', inputRecord.partProp);
	atomStr += addCol('note', inputRecord.comment);
	chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
	    atomStr += addCol('link', tabs[0].url);
	});	

	atomStr += '</entry>' + "\n";

	console.log('XML atom ready: '+atomStr);

	return atomStr;
    }

    this.submitRef = function (inputRecord) {
	var prevState=STATUS;
	statusMgr.changeState(STATE_SUBMITTING);
	//@todo: submit to google spreadsheet
	loginMgr.xhrWithAuth('POST',
			     'https://spreadsheets.google.com/feeds/list/'+gSpreadsheet_key+'/'+gSpreadsheet_sheet+'/private/full',			     
			     this.constructAtom(inputRecord),
			     "application/atom+xml",
			     false, //needs to be authenticated already
			     onSubmissionDone);
	function onSubmissionDone(error, status, response) {
	    console.log('Submission callback.');
	    statusMgr.changeState(prevState);
	    if (!error && status == 201) {
		statusMgr.log('Input submitted to google spreadsheet.');
	    } else {
		statusMgr.log('Possible problem in submission. Status = '+this.status+'; response='+this.response);
	    }
	}
    };
};

// =============================================================================
// === Submit form results to clipboard
// =============================================================================
var clipboardMgr = new function () {
    this.formatToTxt = function(inputRecord) {
	var outputStr = '';
	outputStr += inputRecord.journal + ' ' + inputRecord.number + ' ' + inputRecord.page + '\t';
	outputStr += inputRecord.author + '\t';
	outputStr += inputRecord.year + '\t';
	outputStr += inputRecord.particles + '\t';
	outputStr += inputRecord.partProp + '\t';
	outputStr += inputRecord.comment + '\t';
	return outputStr;
    }

    this.submitRef = function(inputRecord) {
	console.log('Copying to clibboard');
	var prevState=STATUS;
	statusMgr.changeState(STATE_SUBMITTING);
	//create testarea to be used to copy to clipboard
	var copyFrom = document.createElement("textarea");
	document.body.appendChild(copyFrom);
	var outputText = clipboardMgr.formatToTxt(inputRecord);
	console.log('Output text: '+ outputText);
	copyFrom.value = outputText;
	copyFrom.focus();
	copyFrom.select();
	document.execCommand('Copy');
	copyFrom.remove();
	statusMgr.changeState(prevState);
	statusMgr.log('Input copied to cliboard.');
    };

};

// =============================================================================
// === Start-up after document is loaded
// =============================================================================
document.addEventListener('DOMContentLoaded', function () {
    if (STATUS != STATE_PREINIT) return;
    STATUS = STATE_START;
    //Connect elements of html
    statusMgr.connectFields();
    //See if a user is already logged in
    loginMgr.login(false);
});
