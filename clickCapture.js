
$(document).ready(function() {

    // Clear storage on login
    if ("" === document.referrer) {
        //clickCapture.storage.deleteData();
    }

    // Run click capture on mouse click
    $(document).on('click', function(e) {
        clickCapture.captureClick(e);
    });
    
    // Run click capture on enter
    $(document).on('keydown',function(e) {
        if (27 === e.keyCode) {
            clickCapture.utilities.removeClickCaptureModalWindow();
        }
    });
    
    // Run click capture on enter
    $(document).on('keypress',function(e) {
        if (13 === e.which) {
            clickCapture.captureClick(e);
        }
               
        // Check if configured to execute on code word
        clickCapture.utilities.checkIfExecuteWithCode(e);
    });
    
    // Capture any JS errors
    window.addEventListener('error', function(e) { 
        clickCapture.captureJsError(e); 
    });
});

var clickCapture = {

    initializationCode: "99,108,105,99,107,99,97,112,116,117,114,101", // execution code: clickcapture
    executeWithCode: 1, // Change to 0, if executing click capture another way (i.e. by a button)
    typedCode: [], // Code typed by user
    chosenType: "",
    
    // Include for click capture
    include: [
        "select",
        "a",
        "checkbox",
        "radio",
        "button",
        "label",
        "span",
        "submit",
        "li"
    ],
    
    // Exclude by id for click capture
    exclude: [
        "clickCaptureModalWindowCloseBtn"
    ],
    
    // Generate the log based on a type flag
    getLog: function(type) {
        clickCapture.chosenType = type;
        clickCapture.storage.getData();
    },
    
    // Capture errors
    captureJsError: function(e) {
        data = {
            "date": this.utilities.dateTimeStamp(),
            "clicked": "",
            "Id": "",
            "Name": "",
            "Aria-Label": "",
            "Info": "",
            "URL": window.location.href,
            "Error": e.message
        };
        this.storage.saveData(data);
    },
    
    captureConditional: function () {
        return (-1 !== this.include.indexOf($(e.target).prop("tagName").toLowerCase()) 
            || (typeof $(e.target).attr("type") !== "undefined" && -1 !== this.include.indexOf($(e.target).attr("type").toLowerCase())))
            && -1 === this.exclude.indexOf($(e.target).prop("id"));
    },
    
    // Capture each click
    captureClick: function(e) {
        if (this.captureConditional) {
            var data = {
                "date": this.utilities.dateTimeStamp(),
                "clicked": ($(e.target).attr("type")) ? $(e.target).attr("type") : $(e.target).prop("tagName"),
                "Id": e.target.id,
                "Name": e.target.getAttribute('name') ? e.target.getAttribute('name') : "",
                "Aria-Label": (e.target.getAttribute('aria-label')) ? e.target.getAttribute('aria-label') : "",
                "Info": this.utilities.evaluateElement(e),
                "URL": window.location.href,
                "Error": "None"
            } 
            //console.log(JSON.stringify(data));
            this.storage.saveData(data);
        }
    },
    
    // Create a log ordered by date and time
    generateObjLog: function(obj) {
        var formattedObj = clickCapture.utilities.formatData(obj);
        var funcObj      = {
            1: function (formattedObj) {
                clickCapture.utilities.renderModalBox(formattedObj);
            },
            2: function (formattedObj) {
                clickCapture.utilities.returnString(formattedObj);
            },
            3: function (formattedObj) {
                clickCapture.utilities.downloadFile(formattedObj);
            },
            4: function (formattedObj) {
                clickCapture.utilities.newPageRender(formattedObj);
            }
        };
        if (typeof funcObj[clickCapture.chosenType] === "function") {        
            funcObj[clickCapture.chosenType](formattedObj);
        }
    }
};

// Render options
clickCapture.constants = {
    modalBoxRender: 1, // Renders log in a modal window
    returnString: 2, // Returns a string of the log
    downloadFile: 3, // Downloads the log as an html file
    newPageRender: 4 // Renders log in a new page
};

clickCapture.storage = {

    storeName: "clickCapture",
    
    // Initialize the storage
    initializeStorage: function() {
		window.indexedDB      = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
		window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
		window.IDBKeyRange    = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
		if(!window.indexedDB){
			console.log("Browser incompatible with clickCapture");
		} else {
			var open = window.indexedDB.open("clickCaptureDb", 1);
			open.onupgradeneeded = function() {
				var db      = open.result;
				var store   = db.createObjectStore(clickCapture.storage.storeName, {keyPath: "date"});
				var index   = store.createIndex("elemIndex", ["elem.value"]);
			};
			
			return open;
		}
	},
	
	// Delete all
	deleteData: function() {
	    var open = clickCapture.storage.initializeStorage();
		open.onsuccess  = function() {
			var db      = open.result;
			var tx      = db.transaction(clickCapture.storage.storeName, "readwrite");
			var store   = tx.objectStore(clickCapture.storage.storeName);
			var request = store.clear(); 
			     
			request.onerror = function(event) {
				console.log("Delete all was unsuccessful");
			};       
			
			clickCapture.storage.storageTransactionComplete(tx, db);
		};
	},
	
	// Select all
	getData: function() {
	    var open = clickCapture.storage.initializeStorage();
	    open.onsuccess = function() {				
	        var db           = open.result;
	        var tx           = db.transaction(clickCapture.storage.storeName, "readwrite");
	        var store        = tx.objectStore(clickCapture.storage.storeName);
	        var index        = store.index("elemIndex");  
	        var storeObj     = [];
	        var getAll       = store.openCursor();
	        var obj          = {};	
	        getAll.onsuccess = function(event) {
		        var cursor = event.target.result;
		        if(cursor){
			        storeObj.push(cursor.value);
			        cursor.continue();
		        } else {
			        clickCapture.generateObjLog(storeObj);			    			       
	            }
		    }
        }
	},
	
	// Insert data
    saveData: function(obj) {
        var open = clickCapture.storage.initializeStorage();
        open.onsuccess = function() {				
			var db      = open.result;
			var tx      = db.transaction(clickCapture.storage.storeName, "readwrite");
			var store   = tx.objectStore(clickCapture.storage.storeName);
			var index   = store.index("elemIndex");			    
			store.add(
				obj
			);	
			clickCapture.storage.storageTransactionComplete(tx, db);
		};
		
		open.onerror = function() {
			console.log("Save click was unsuccessful");
		}
    },
    
    storageTransactionComplete: function(tx, db){
		tx.oncomplete = function() {
			db.close();
		};
	}
};

clickCapture.utilities = {

    // Stylings
    divContStyling: "style='margin: 10px; display: inline-block; vertical-align: top;'",
    cellStyling: "style='padding: 5px; border: solid 1px #ccc; text-align: left'",
    tableStyling: "style='border-collapse: collapse'",
    
    // Check for execution code
    checkIfExecuteWithCode: function(e) {
        if (1 === clickCapture.executeWithCode) {
            clickCapture.typedCode.push(e.keyCode);
            if (clickCapture.typedCode.toString().indexOf(clickCapture.initializationCode) >= 0) {
                /* Options:
                 * clickCapture.constants.modalBoxRender
                 * clickCapture.constants.returnString
                 * clickCapture.constants.downloadFile
                 * clickCapture.constants.newPageRender
                 */
                clickCapture.getLog(clickCapture.constants.modalBoxRender);
                clickCapture.typedCode = [];
            } 
        }
    },
    
    // Make table for click log
    makeClickLogTable: function(obj) {
        var tblePrt1 = "<div " + clickCapture.utilities.divContStyling + "><table " + clickCapture.utilities.tableStyling + ">" +
                       "<thead>" +
                       "<tr>" +
                       "<th colspan='7' " + clickCapture.utilities.cellStyling + ">Click Log:</th>" +
                       "</tr>" +
                       "<tr>" +
                       "<th " + clickCapture.utilities.cellStyling + ">Date & Time</th>" +
                       "<th " + clickCapture.utilities.cellStyling + ">Page</th>" +
                       "<th " + clickCapture.utilities.cellStyling + ">Clicked</th>" +
                       "<th " + clickCapture.utilities.cellStyling + ">Aria Label</th>" +
                       "<th " + clickCapture.utilities.cellStyling + ">Element Id</th>" +
                       "<th " + clickCapture.utilities.cellStyling + ">Element Name</th>" +
                       "<th " + clickCapture.utilities.cellStyling + ">Text for Element</th>" +
                       "</tr>" +
                       "</thead>" +
                       "<tbody>";
                                              
        var tblePrt2 = "</tbody></table></div>";
        var rows     = "";
        $.each(obj, function(key, value) {
            rows += "<tr><td " + clickCapture.utilities.cellStyling + ">" + key + "</td>" +
                    "<td " + clickCapture.utilities.cellStyling + ">" + value.Page + "</td>" +
                    "<td " + clickCapture.utilities.cellStyling + ">" + value.Clicked.toLowerCase() + "</td>" +
                    "<td " + clickCapture.utilities.cellStyling + ">" + value["Aria Label"] + "</td>" +
                    "<td " + clickCapture.utilities.cellStyling + ">" + value["Element Id"] + "</td>" +
                    "<td " + clickCapture.utilities.cellStyling + ">" + value["Element Name"] + "</td>" +
                    "<td " + clickCapture.utilities.cellStyling + ">" + value["Other Information"] + "</td></tr>";
        });
        
        if ("" !== rows) {
            return tblePrt1 + rows + tblePrt2;
        }
        
        return tblePrt1 + "<tr><td colspan='7' " + clickCapture.utilities.cellStyling + ">No records</td></tr>" + tblePrt2;
    },
    
    // Make table for error log
    makeErrorLogTable: function(obj) {
        var tblePrt1 = "<div " + clickCapture.utilities.divContStyling + "><table " + clickCapture.utilities.tableStyling + ">" +
                       "<thead>" +
                       "<tr>" +
                       "<th colspan='3' " + clickCapture.utilities.cellStyling + ">Error Log:</th>" +
                       "</tr>" +
                       "<tr>" +
                       "<th " + clickCapture.utilities.cellStyling + ">Date & Time</th>" +
                       "<th " + clickCapture.utilities.cellStyling + ">Page</th>" +
                       "<th " + clickCapture.utilities.cellStyling + ">Error</th>" +
                       "</tr>" +
                       "</thead>" +
                       "<tbody>";
                       
        var tblePrt2 = "</tbody></table></div>";
        var rows     = "";
        $.each(obj, function(key, value) {
            rows += "<tr><td " + clickCapture.utilities.cellStyling + ">" + key + "</td>" +
                    "<td " + clickCapture.utilities.cellStyling + ">" + value.Page + "</td>" +
                    "<td " + clickCapture.utilities.cellStyling + ">" + value.Error + "</td></tr>";
        });
        
        if ("" !== rows) {
            return tblePrt1 + rows + tblePrt2;
        }
        
        return tblePrt1 + "<tr><td colspan='3' " + clickCapture.utilities.cellStyling + ">No records</td></tr>" + tblePrt2;
    },
    
    // Make table for page log
    makePageLogTable: function(obj) {
        var tblePrt1 = "<div " + clickCapture.utilities.divContStyling + "><table " + clickCapture.utilities.tableStyling + ">" +
                       "<thead>" +
                       "<tr>" +
                       "<th colspan='2' " + clickCapture.utilities.cellStyling + ">Page Navigation:</th>" +
                       "</tr>" +
                       "<tr>" +
                       "<th " + clickCapture.utilities.cellStyling + ">Date & Time</th>" +
                       "<th " + clickCapture.utilities.cellStyling + ">Page</th>" +
                       "</tr>" +
                       "</thead>" +
                       "<tbody>";
                       
        var tblePrt2 = "</tbody></table></div>";
        var rows     = "";
        $.each(obj, function(key, value) {
            rows += "<tr><td " + clickCapture.utilities.cellStyling + ">" + value + "</td>" +
                    "<td " + clickCapture.utilities.cellStyling + ">" + key + "</td></tr>";
        });
        
        if ("" !== rows) {
            return tblePrt1 + rows + tblePrt2;
        }
        
        return tblePrt1 + "<tr><td colspan='2' " + clickCapture.utilities.cellStyling + ">No records</td></tr>" + tblePrt2;
    },
    
    // Initiate file string
    returnString: function(obj) {
        return clickCapture.utilities.formatForString(obj);
    },
    
    // Format data for html new page
    newPageRender: function(obj) {
        var formattedText = "";
        var forWindow     = "";
        formattedText    += clickCapture.utilities.makePageLogTable(obj.byUrl);
        formattedText    += clickCapture.utilities.makeErrorLogTable(obj.byError);
        formattedText    += clickCapture.utilities.makeClickLogTable(obj.byClicks);  
        forWindow         = "<!DOCTYPE html><title>Click Log</title><head></head><form><body>" + formattedText + "</body></form>";
        var tab           = window.open('about:blank', '_blank');
        tab.document.write(forWindow);
        tab.document.close();
    },
    
    // Initiate file download
    downloadFile: function(obj) {
        var element  = document.createElement('a');
        var filename = "clickCapture.html";
        var json     = clickCapture.utilities.formatForHtmlFile(obj);
        var blob     = new Blob([json], {type: "octet/stream"});
        var url      = window.URL.createObjectURL(blob);
        element.setAttribute('href', url);
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    },
    
    // Format data as string
    formatForString: function(obj) {
        var formattedText = "";
        formattedText    += clickCapture.utilities.makePageLogTable(obj.byUrl);
        formattedText    += clickCapture.utilities.makeErrorLogTable(obj.byError);
        formattedText    += clickCapture.utilities.makeClickLogTable(obj.byClicks);
        
        return formattedText;
    },
    
    // Format data for html file
    formatForHtmlFile: function(obj) {
        var formattedText = "";
        formattedText    += clickCapture.utilities.makePageLogTable(obj.byUrl);
        formattedText    += clickCapture.utilities.makeErrorLogTable(obj.byError);
        formattedText    += clickCapture.utilities.makeClickLogTable(obj.byClicks);
        
        return "<!DOCTYPE html><title>Click Log</title><head></head><form><body>" + formattedText + "</body></form>";
    },

    // Render the modal window
    renderModalBox: function(obj) {
        var html = "";
        clickCapture.utilities.buildModalWindow();
        if ($("#clickCaptureModalWindowTextCont")) {
            html += clickCapture.utilities.makePageLogTable(obj.byUrl);
            html += clickCapture.utilities.makeErrorLogTable(obj.byError);
            html += clickCapture.utilities.makeClickLogTable(obj.byClicks);
        } 
        
        $("#clickCaptureModalWindowTextCont").html(html);
    },
    
    // Build the modal window
    buildModalWindow: function() {
        var outerDiv                   = document.createElement("div");
        outerDiv.id                    = "clickCaptureModalWindowContainer";
        outerDiv.style.display         = "block";
        outerDiv.style.position        = "fixed";
        outerDiv.style.zIndex          = 999998;
        outerDiv.style.paddingTop      = "100px";
        outerDiv.style.left            = 0;
        outerDiv.style.top             = 0;
        outerDiv.style.width           = "100%";
        outerDiv.style.height          = "100%";
        outerDiv.style.overflow        = "auto";
        outerDiv.style.backgroundColor = "rgb(0,0,0)";
        outerDiv.style.backgroundColor = "rgba(0,0,0,0.4)"; 
        
        var innnerDiv                   = document.createElement("div");   
        innnerDiv.id                    = "clickCaptureModalWindow";   
        innnerDiv.style.borderRadius    = "5px";
        innnerDiv.style.border          = "1px solid #888";
        innnerDiv.style.width           = "80%";
        innnerDiv.style.padding         = "5px 10px 50px 10px";
        innnerDiv.style.margin          = "auto auto 200px auto";
        innnerDiv.style.backgroundColor = "#fefefe";
        
        var closeBtnSpan              = document.createElement("span"); 
        closeBtnSpan.id               = "clickCaptureModalWindowCloseBtn";  
        closeBtnSpan.style.display    = "block";
        closeBtnSpan.style.float      = "right";
        closeBtnSpan.style.fontWeight = "bold";
        closeBtnSpan.style.zIndex     = 100000;
        closeBtnSpan.innerHTML        = "&times;";
        closeBtnSpan.style.cursor     = "Pointer";
        closeBtnSpan.style.fontSize   = "30px";
        closeBtnSpan.style.top        = "-10px";
        closeBtnSpan.style.position   = "relative";
        closeBtnSpan.setAttribute("onclick", "clickCapture.utilities.removeClickCaptureModalWindow()");
        closeBtnSpan.setAttribute("title", "Close this window");
        
        var clearBtnSpan               = document.createElement("span"); 
        clearBtnSpan.id                = "clickCaptureModalWindowCloseBtn2";  
        clearBtnSpan.style.display     = "block";
        clearBtnSpan.style.float       = "right";
        clearBtnSpan.style.fontWeight  = "bold";
        clearBtnSpan.style.zIndex      = 100000;
        clearBtnSpan.innerHTML         = "Clear";
        clearBtnSpan.style.cursor      = "Pointer";
        clearBtnSpan.style.fontSize    = "20px";
        clearBtnSpan.style.top         = "-3px"; 
        clearBtnSpan.style.marginRight = "20px";
        clearBtnSpan.style.position    = "relative";
        clearBtnSpan.setAttribute("onclick", "clickCapture.storage.deleteData(); alert('Data has been cleared')"); 
        clearBtnSpan.setAttribute("title", "Clear this data");
        
        var textDiv                   = document.createElement("div");
        textDiv.id                    = "clickCaptureModalWindowTextCont";  
        textDiv.style.width           = "100%";
        textDiv.style.overflowY       = "auto";
     
        document.body.appendChild(outerDiv);
        document.querySelector("#clickCaptureModalWindowContainer").appendChild(innnerDiv);
        document.querySelector("#clickCaptureModalWindow").appendChild(closeBtnSpan);
        document.querySelector("#clickCaptureModalWindow").appendChild(clearBtnSpan);
        document.querySelector("#clickCaptureModalWindow").appendChild(textDiv);
    },
    
    // Destory modal window
    removeClickCaptureModalWindow: function() {
        if ($("#clickCaptureModalWindowContainer")) {
            $("#clickCaptureModalWindowContainer").remove();
        }
    },
    
    // Format the data
    formatData: function(obj) {
        var urlObj   = {};
        var errorObj = {};
        var logObj   = {};
        $.each(obj, function(key, value) {
            //console.log( key + ": " + JSON.stringify(value) );
            urlObj = clickCapture.utilities.formatForUrl(urlObj, key, value);
            errorObj = clickCapture.utilities.formatForError(errorObj, key, value);
            logObj = clickCapture.utilities.formatForLog(logObj, key, value);
        });
        
        return {
            "byUrl": urlObj,
            "byError": errorObj,
            "byClicks": logObj
        };
    },
    
    // Make log object
    formatForLog: function(Obj, key, value) {
        Obj[value.date] = {
            "Page": value.URL,
            "Clicked": value.clicked,
            "Aria Label": value["Aria-Label"],
            "Element Id": value.Id,
            "Element Name": value.Name,
            "Other Information": value.Info
        };
        
        return Obj;
    },
    
    // Make url obj
    formatForUrl: function(Obj, key, value) {
        if ("" !== value.URL) {
            Obj[value.URL] = value.date;
        }
        
        return Obj;
    },
    
    // Make error obj
    formatForError: function(Obj, key, value) {
        if ("None" !== value.Error) {
            Obj[value.date] = {
                "Page": value.URL,
                "Error": value.Error
            };
        }
        
        return Obj;
    },

    // Perform specific actions on certain elements
    evaluateElement: function(e) {
        obj = {
            "SELECT": function (e) {
                return clickCapture.utilities.getSelectedOptions(e);
            },
            "A": function (e) {
                return clickCapture.utilities.getHref(e);
            }
        };
    
        var retVal = $(e.target).text();
        if (typeof obj[$(e.target).prop("tagName")] === "function") {
            retVal = obj[$(e.target).prop("tagName")](e);
        }
        
        return retVal;
    },
    
    // Get the link
    getHref: function(e) {
        var text = $(e.target).text();
        var href =  e.target.getAttribute('href');
        
        if ("" !== href) {
            text = text + ": " + href;
        }
        
        return text;
    },
    
    // Get selected option text
    getSelectedOptions: function(e) {
        var label  = clickCapture.utilities.findLabel(e);
        var value  = $(e.target).find("option:selected").text();

        return label + value;
    },
    
    // Find element label
    findLabel: function(e) {
        var label = $(e.target).parent()
            .find("label")
            .text();
        if ("" !== label) {
            label = label + ": ";
        }
        
        return label;
    },

    // Create date and time stamp
    dateTimeStamp: function() {
        var currentdate = new Date();
        return pad(currentdate.getMonth() + 1) + "/"
            + pad(currentdate.getDate()+1) + "/"
            + pad(currentdate.getFullYear()) + " "
            + pad(currentdate.getHours()) + ":"
            + pad(currentdate.getMinutes()) + ":"
            + pad(currentdate.getSeconds());
    
        // Private
        function pad(n){
            return n < 10 ? "0" + n : n;
        };
    }
};


