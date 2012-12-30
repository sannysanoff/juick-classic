// ==UserScript==
// @name        Juick Classic
// @namespace   com.juickadvanced
// @description Juick Classic Style
// @include     http://juick.com/*
// @include     http://dev.juick.com/*
// @grant 	none
// @version     1.8
// ==/UserScript==

// mozilla guid 41ee170c-9409-43b7-898d-c5de44b553db
// https://arantius.com/misc/greasemonkey/script-compiler.php

var mode = "UNKNOWN";
var LIs = document.getElementsByTagName("LI");
var firefox = navigator.userAgent.indexOf("Gecko") != -1;
var opera = navigator.userAgent.indexOf("Presto") != -1;
var globals = {}

// detecting our location
for (var i = 0; i < LIs.length; i++) {
    var clazz = LIs[i].getAttribute("class");
    if (clazz && clazz.indexOf("msgthread") != -1) {
        mode = "THREAD";
        break;
    }
    if (clazz && clazz.indexOf("msg") != -1) {
        mode = "MESSAGES";
        break;
    }
}

function setText(element, txt) {
    while(element.firstChild) {
        element.removeChild(element.firstChild);
    }
    element.appendChild(element.ownerDocument.createTextNode(txt));

}

function setCookie(c_name, value, exdays) {
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
    document.cookie = c_name + "=" + c_value;
}

function getCookie(c_name) {
    var i, x, y, ARRcookies = document.cookie.split(";");
    for (i = 0; i < ARRcookies.length; i++) {
        x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
        y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
        x = x.replace(/^\s+|\s+$/g, "");
        if (x == c_name) {
            return unescape(y);
        }
    }
}

var theme = getCookie("juick_classic_theme");
var bright = theme ? theme != "dark" : true;


var style = document.createElement("style");
style.appendChild(document.createTextNode("a { color: #b07131; }"));


var jnotify = document.getElementsByName("jnotify");
if (jnotify.length == 1 && jnotify[0].nodeName.toLowerCase() == "input") {
    //
    // settings page.
    //
    mode = "SETTINGS"
    var form = jnotify[0].parentNode.parentNode       // form
    var p = document.createElement("p");
    //
    // adding theme selection checkbox
    //
    var input = document.createElement("input");
    input.setAttribute("type", "checkbox");
    if (!bright)
        input.checked = true;
    p.appendChild(input);
    p.appendChild(document.createTextNode(" Dark theme"));
    input.onclick = function () {
        if (input.checked) {
            setCookie("juick_classic_theme", "dark", 5000);
        } else {
            setCookie("juick_classic_theme", "bright", 5000);
        }
        window.alert("Theme changed. Please reload page to see new theme.");
    }
    form.insertBefore(p, jnotify[0].parentNode);
    if (bright) {
    } else {
        style.appendChild(document.createTextNode("#content.pagetext { background: #464641; }"));
    }
}

if (bright) {
    // single message
    style.appendChild(document.createTextNode("li.msg { background: #eeeedf; }"));
    style.appendChild(document.createTextNode("#nav-right a { color: #b07131; font-weight: bold; }"));
    // header
    style.appendChild(document.createTextNode("#hwrapper { background: #b2b283; }"));
    // remove too much whitespace
    style.appendChild(document.createTextNode(".msg { padding: 3px;}"));
    document.body.style.backgroundColor = "#cbcb9c";
} else {
    style.appendChild(document.createTextNode("#mtoolbar { background: #31312f; }"));
    style.appendChild(document.createTextNode("html { background: black; }"));
    style.appendChild(document.createTextNode("li.msg, .title2 { background: #464641; }"));
    style.appendChild(document.createTextNode(".msg { border: none; padding: 3px;}"));
    // this is service toolbar
    style.appendChild(document.createTextNode("div { color: white; }"));
    style.appendChild(document.createTextNode("#hwrapper { background: #000000; }"));
    document.body.style.backgroundColor = "#31312f";
}


if (mode == "THREAD") {
    // fixing column position
    var content = document.getElementById("content");
    content.style.paddingLeft = "40px";
}

//
// returns msgid
//
function processMessage(message) {
    //
    // remove timestamp with annoying dropdown which is expected to be clicked,
    // and add proper msgid link and timestamp as text
    //
    var msgtxt = null;
    var msgts = null;
    var msgtss = message.getElementsByClassName("msg-ts");
    if (msgtss.length > 0) {
        msgts = msgtss[0];
    }
    var msgtxts = message.getElementsByClassName("msg-txt");
    if (msgtxts.length > 0) {
        msgtxt = msgtxts[0];
    }
    var forms = message.getElementsByTagName("FORM");
    if (forms.length > 0) {
        forms[0].style.display = "none";
    }
    if (msgtxt != null && msgts != null) {
        var a = msgts.getElementsByTagName("A")[0];
        var href = "" + a.href;
        var numberIndex = href.lastIndexOf("/");
        var msgid = href.substring(numberIndex + 1);
        var date = a.innerHTML;
        var newPart = message.ownerDocument.createElement("div");
        var comments = message.getElementsByClassName("msg-comments");
        msgts.style.display = "none";
        // proper link to message #12345
        var theA = message.ownerDocument.createElement("a");
        theA.setAttribute("href", href);
        theA.appendChild(message.ownerDocument.createTextNode("#" + msgid));
        // plain text date
        var theSpan = message.ownerDocument.createElement("span");
        theSpan.setAttribute("class","msg-ts");
        theSpan.appendChild(message.ownerDocument.createTextNode(date));
        if (comments.length == 0) {
            theA.setAttribute("style", "padding-left: 60px; font-size: small;")
            newPart.appendChild(theA);
            newPart.appendChild(theSpan);
            // A and SPAN together
            msgtxt.parentNode.insertBefore(newPart, forms[0]);
        } else {
            var commentz = comments[0];
            theA.setAttribute("style", "padding-right: 10px;")
            // A before list of commenters
            commentz.insertBefore(theA, commentz.firstChild);
            commentz.appendChild(theSpan);
        }
        return msgid;
    }
    return null;
}

function processComment(message) {
    //
    // remove timestamp with annoying dropdown which is expected to be clicked,
    // and add proper msgid link and timestamp as text
    //
    var msgts = null;
    var msgtss = message.getElementsByClassName("msg-ts");
    if (msgtss.length > 0) {
        msgts = msgtss[0];
    }
    if (msgts != null) {
        var a = msgts.getElementsByTagName("A")[0];
        var date = a.innerHTML;
        var links = message.getElementsByClassName("msg-links")[0];
        msgts.style.display = "none";
        var theSpan = message.ownerDocument.createElement("span");
        theSpan.setAttribute("class","msg-ts");
        theSpan.appendChild(message.ownerDocument.createTextNode(date));
        links.appendChild(theSpan);
    }
}

function collectMessages(doc) {
    var msgs = new Array();
    try {
        var iter = doc.evaluate("//LI[@class='msg']", doc, null, XPathResult.ANY_TYPE, null);
        for (var message; message = iter.iterateNext();) {
            msgs.push(message)
        }
    } catch (e) {
        var maybeMessages = doc.getElementsByTagName("LI");
        for (var i = 0; i < maybeMessages.length; i++) {
            var message = maybeMessages[i];
            if (message.getAttribute("class") == "msg") {
                msgs.push(message)
            }
        }
    }
    return msgs;
}

if (mode == "MESSAGES") {
    var leftColumn = document.getElementById("column");
    var rcol = document.getElementById("rcol");
    if (rcol == null) {
        mode = "USERBLOG";
        var wrapper = document.getElementById("wrapper");
        if (wrapper != null) {
            //
            // Adding missing right column for user blog page
            //
            rcol = document.createElement("div");
            rcol.style.float = "left";
            rcol.setAttribute("id","rcol");
            rcol.created = "true";
            wrapper.appendChild(rcol);
            var content = document.getElementById("content");
            if (firefox || opera) {
                rcol.style.marginLeft = "680px";
            } else {
                content.style.float = "left";
            }
        }
    } else {
        // fixing position for general messages
        rcol.style.marginLeft = "-320px";
    }
    if (rcol != null) { // maybe user blog?
        // fixing column position
        style.appendChild(document.createTextNode("#content { padding-left: 40px; padding-right: 40px; margin: 0px;}"));
        rcol.appendChild(leftColumn);
    }
    var maybeMessages = document.getElementsByClassName("msg");
    for (var i = 0; i < maybeMessages.length; i++) {
        var message = maybeMessages[i];
        if (message.nodeName.toLowerCase() == "li") {
            globals.lastLi = message;
            var msgid = processMessage(message);
            if (msgid) {
                globals.lastLi.msgid = msgid;
            }

            // new messages will be inserted after lastLi
        }
    }
}

if (mode == "THREAD") {
    //
    // fixing HASH sign
    //
    var mtoolbar = document.getElementById("mtoolbar");
    if (mtoolbar) {
        var as = mtoolbar.getElementsByTagName("A");
        if (as.length > 0) {
            var a = as[0];
            var href = a.getAttribute("href");
            var msgno = href.substr(href.lastIndexOf("/")+1);
            a.href = ""+msgno;
            setText(a, "#"+msgno);
        }
    }
    //
    // fixing missing comment self-link
    //
    links = document.getElementsByClassName("msg-links")
    for(var i=0; i<links.length; i++) {
        var linkz = links[i];
        var fc = linkz.firstChild;
        var lh = fc.nodeValue;      // text node
        if (lh.substr(0, 1) == "/") {
            var space = lh.indexOf(" ")
            var rid = lh.substr(1, space);
            lh = lh.substr(space);
            fc.nodeValue = lh;
            var theA = linkz.ownerDocument.createElement("a");
            theA.setAttribute("href", "#"+rid);
            theA.appendChild(linkz.ownerDocument.createTextNode("/" + rid));
            linkz.insertBefore(theA, linkz.firstChild);
        }
    }
    var comments = collectMessages(document);
    for (var i in comments) {
        processComment(comments[i]);
    }
}

document.body.appendChild(style);

document.body.style.visibility = "visible";

globals.loading = false;

function findLastPart(doc) {
    var lastPara = null;
    try {
        var iter = doc.evaluate("//P[@class='page']", doc, null, XPathResult.ANY_TYPE, null);
        for (var message; message = iter.iterateNext();) {
            lastPara = message;
            break;
        }
    } catch (e) {
        var allP = doc.getElementsByTagName("P");
        for(var i in allP) {
            var maybeP = allP[i];
            if (maybeP.getAttribute && maybeP.getAttribute("class") == "page") {
                lastPara = maybeP;
                break;
            }
        }
    }
    if (lastPara != null) {
        var lastA = lastPara.getElementsByTagName("A");
        if (lastA.length == 1) {
            return {lastPara: lastPara, lastA: lastA[0]}
        }
    }
    return null;
}

function doAjaxRequest(url, callback) {
    try {
        var req = new XMLHttpRequest();
        req.open("GET", url);
        req.onload = function () {
            callback(req.responseText);
        }
        req.send();
    } catch (e) {
        try {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                onload: function (response) {
                    callback(response.responseText);
                }
            });
        } catch (e) {
            document.title = "Sorry, unable to make XMLHttpRequest";
        }
    }

}
window.onscroll = function () {
    var nVScroll = document.documentElement.scrollTop || document.body.scrollTop;
    //document.title = "SCROLL="+(nVScroll+window.innerHeight)+" BODYHEI="+document.body.offsetHeight+" SIGN="+(nVScroll + window.innerHeight - (document.body.offsetHeight - window.innerHeight * 4))+" ";
    try {
        if (nVScroll + window.innerHeight > document.body.offsetHeight - window.innerHeight * 4) {
            // two pages in advance
            if (globals.loading) return;
            globals.loading = true;
        } else {
            return;
        }
        var lastPart = findLastPart(document);
        if (lastPart != null) {
            setText(lastPart.lastA,"Loading next...");
            var url = "" + lastPart.lastA.href;
            var lastMsgId = globals.lastLi.msgid;
            //
            // putting parameter in place
            //
            if (url.indexOf("before=")) {
                url = url.replace(new RegExp("before=(\\d+)","gm"),function(x) { return "before="+lastMsgId; })
            } else {
                if (url.indexOf("?") == -1) {
                    url = url + "?before="+lastMsgId;
                } else {
                    url = url + "&before="+lastMsgId;
                }
            }
            //
            //
            //
            doAjaxRequest(url, function(response) {
                globals.loading = false;
                setText(lastPart.lastA,"Older...");
                window.setTimeout(function () {
                    try {
                        var doc = document.implementation.createHTMLDocument('');
                        if (firefox || opera) {
                            //
                            // HTML parsed like this is safe, because it's detached HTML (javascript is not executed etc), good for xpath though.
                            // I could not find other ways to parse HTML page for subsequent xpath querying in Firefox.
                            doc.body.innerHTML = response;
                        } else {
                            doc.write(response);
                        }
                        var msgs = collectMessages(doc);
                        for (var i in msgs) {
                            var message = msgs[i];
                            var myMessage = document.importNode(message, true);
                            globals.lastLi.parentNode.appendChild(myMessage);
                            globals.lastLi = myMessage;
                            var msgid = processMessage(myMessage);
                            if (msgid) {
                                globals.lastLi.msgid = msgid;
                            }
                        }
                        var lastPart2 = findLastPart(doc);
                        if (lastPart2 == null) {

                        } else {
                            setText(lastPart.lastA, lastPart2.lastA.innerHTML);
                            lastPart.lastA.href = lastPart2.lastA.getAttribute("href");
                        }
                    } catch (e) {
                        window.alert(e);
                    }
                }, 100)
            })
        } else {
            //window.alert("Last part is null");
        }
    } catch (e) {
        window.alert(e);
    }


}

