// ==UserScript==
// @name        Juick Classic
// @namespace   com.juickadvanced
// @description Juick Classic Style
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js
// @include     http://juick.com/*
// @include     http://dev.juick.com/*
// @grant       none
// @version     1.29
// ==/UserScript==


window.console.log("JA: launched!")

try {

    console.log("main_process definitiion begin")
    function main_process(document, window) {
        window.console.log("JA: launched!")
        try {
            var $=window.jQuery;
            if (!document.body || !window.jQuery) {
                window.console.log("JA: body is not ready or jquery is not ready");
                window.setTimeout(function() {main_process(document, window)}, 10);
                return;
            }
            window.console.log("JA: main_process")
            var mode = "UNKNOWN";
            var LIs = document.getElementsByTagName("LI");
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

            function getText(element) {
                var sb = "";
                if (element.nodeValue) {
                    sb = sb + element.nodeValue;
                }
                var scan = element.firstChild;
                while(scan) {
                    sb += getText(scan);
                    scan = scan.nextSibling;
                }
                return sb;
            }

            function setCookie(c_name, value, exdays) {
                var exdate = new Date();
                exdate.setDate(exdate.getDate() + exdays);
                var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
                // is there other way of setting cookie?
                document.cookie = c_name + "=" + c_value;
            }

            function getCookie(c_name) {
                var x, y, ARRcookies = document.cookie.split(";");
                for (var i = 0; i < ARRcookies.length; i++) {
                    x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
                    y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
                    x = x.replace(/^\s+|\s+$/g, "");
                    if (x == c_name) {
                        return unescape(y);
                    }
                }
            }

            function getAbsoluteLeft(elem) {
                var left = 0;
                var curr = elem;
                // This intentionally excludes body which has a null offsetParent.
                while (curr.offsetParent) {
                    left -= curr.scrollLeft;
                    curr = curr.parentNode;
                }
                while (elem) {
                    left += elem.offsetLeft;
                    elem = elem.offsetParent;
                }
                return left;
            };


            var pendingAjaxs = new Array();
            var requestInProgress = false;

            function maybeNextAjaxRequest() {
                if (pendingAjaxs.length > 0) {
                    pendingAjaxs.shift()(); // call lazy function
                }

            }

            function doAjaxRequest(url, callback, wantXML) {
                try {
                    var req;
                    if (opera) req = new window.XMLHttpRequest(); else req = new XMLHttpRequest();
                    req.open("GET", url, true);
                    req.onload = function () {
                        try {
                            if (wantXML) {
                                callback(req.responseXML);
                            } else {
                                callback(req.responseText);
                            }
                        } catch (e) {
                            window.console.log("JA(2): "+e)
                            alert("doAjaxRequest: "+e);
                        }
                    }
                    req.send();
                } catch (e) {
                    try {
                        if (requestInProgress) {
                            pendingAjaxs.push(function() { // lazy function call
                                doAjaxRequest(url, callback, wantXML);
                            })
                        } else {
                            requestInProgress = true;
                            GM_xmlhttpRequest({
                                method: "GET",
                                url: url,
                                onload: function (response) {
                                    try {
                                        try {
                                            if (response.charCodeAt && response.length) {
                                                // is string
                                                response = ""+response;
                                            } else {
                                                response = response.responseText;
                                            }
                                        } catch (e) {
                                            response = response.responseText;
                                        }
                                        if (wantXML) {
                                            callback(parseHTML(response));
                                        } else {
                                            callback(response);
                                        }
                                    } catch (e) {
                                        window.console.log("JA(3): "+e)
                                        //alert("GM_xmlhttpRequest: "+e+" response="+response+" resp.rx="+respo);
                                    } finally {
                                        requestInProgress = false;
                                        maybeNextAjaxRequest();
                                    }
                                },
                                onerror: function () {
                                    requestInProgress = false;
                                    maybeNextAjaxRequest();
                                },
                                ontimeout: function() {
                                    requestInProgress = false;
                                    maybeNextAjaxRequest();
                                }
                            });
                        }
                    } catch (e) {
                        window.console.log("JA(4): "+e)
                        //document.title = "Sorry, unable to make XMLHttpRequest: "+e;
                    }
                }

            }

            function parseHTML(response) {
                var docu = null;
                var resp = ""+response;
                window.console.log("Trying comps");
                var comps = null; try { comps = Components; } catch(e) { /* not found; */ }
                window.console.log("Done trying comps");
                if (firefox && comps && comps.classes) {
                    // firefox addon mode
                    window.console.log("firefox addon mode");
                    try {
                        const PARSER_UTILS = "@mozilla.org/parserutils;1";
                        var newDoc = document.implementation.createHTMLDocument('')
                        if (PARSER_UTILS in Components.classes) {

                            var parser = Components.classes[PARSER_UTILS].getService(Ci.nsIParserUtils);
                            if ("parseFragment" in parser) {
                                docu = parser.parseFragment(response, true,
                                    false, null, document.documentElement);
                                newDoc.body.appendChild(docu);
                                docu = newDoc;
                            }
                        }
                        if (!docu) {
                            docu = Components.classes["@mozilla.org/feed-unescapehtml;1"]   // fallback snippet from mozilla
                                .getService(Components.interfaces.nsIScriptableUnescapeHTML)
                                .parseFragment(html, false, null, document.documentElement);
                            newDoc.body.appendChild(docu);
                            docu = newDoc;
                        }
                    } catch (e) {
                        window.console.log("JA(5): "+e)
                        alert(e);
                    }
                } else if (firefox) {
                    window.console.log("firefox gm mode");
                    // firefox in greasemonkey mode
                    var parser = new DOMParser();
                    docu = parser.parseFromString(response, "text/html");
                } else if (opera) {
//FIREFOX_CUT_START
                    window.console.log("opera mode");
                    docu = document.implementation.createHTMLDocument('')
                    //
                    // HTML parsed like this is safe, because it's detached HTML (javascript is not executed etc), good for xpath though.
                    // I could not find other ways to parse HTML page for subsequent xpath querying in Firefox.
                    $(docu.body).html(response);
//FIREFOX_CUT_END
                } else {
                    window.console.log("chrome possibly?");
                    docu = document.implementation.createHTMLDocument('')
                    docu.write(response);
                }
                return docu;
            }

            // (C) power juick
            function getElementsByXPath(xpath, root){
                var result = document.evaluate(xpath, root, null, 0, null);
                var nodes = new Array();
                i = 0;
                while (node = result.iterateNext()) {
                    nodes[i] = node;
                    i++;
                }

                return nodes;
            }

            // (C) power juick (mostly)
            function inlineMedia(root) {
                var all_links = getElementsByXPath("div[@class='msg-txt']/a", root);

                function createImageLink(elem, imgref, linkref) {
                    var a = document.createElement("a");
                    a.setAttribute("href", linkref);
                    var img = document.createElement("img");
                    img.setAttribute("src", imgref);
                    img.setAttribute("style", "max-width: 500px; max-height: 400px; width: auto; height: auto;");
                    a.appendChild(img);
                    elem.appendChild(a);
                }

                function createYoutube(elem, imgref, linkref) {
                    var elem = document.createElement("div");
                    elem.setAttribute("style", "margin-top: 5px;");

                    $(elem).html('<object style="max-width: 560px; width: 100%; height: 340px;"><param name="movie" name="dest1" value="http://www.youtube.com/v/'
                        + 'ZZZZZ'
                        + '&hl=ru_RU&fs=1&"></param><param name="allowFullScreen" value="true"></param><param name="wmode" value="transparent"></param><param name="allowscriptaccess" value="always"></param><embed name="dest2" src="http://www.youtube.com/v/'
                        + 'ZZZZZ'
                        + '&hl=ru_RU&fs=1&" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" wmode="transparent" style="max-width: 560px; width: 100%; height: 340px;"></embed></object>');
                    var dest1E = elem.firstChild.firstChild  // dest1
                    dest1E.setAttribute("value", dest1E.getAttribute("value").replace("ZZZZZ", tubeid[1]));
                    var dest2E = dest1E.nextSibling.nextSibling.nextSibling.nextSibling;    // dest2
                    dest2E.setAttribute("src", dest2E.getAttribute("src").replace("ZZZZZ", tubeid[1]));
                    return elem;
                }

                for (var li = 0; li < all_links.length; li++) {
                    var node = all_links[li];
                    if (tubeid = /youtube\.com\/watch\?v=(.+)/
                        .exec(node.href)) { // YouTube
                        node.parentNode.insertBefore(createYoutube(tubeid[1]), node.nextSibling);
                    } else if (tubeid = /youtu\.be\/(.+)/
                        .exec(node.href)) { // YouTube
                        node.parentNode.insertBefore(createYoutube(tubeid[1]), node.nextSibling);
                    } else if (myurl = /http:\/\/gelbooru\.com\/index\.php\?page=post\&s=view\&id=(\d+)/
                        .exec(node.href)) { // Gelbooru
                        (function(node){
                            try {
                                doAjaxRequest("http://acao-0x588.herokuapp.com/acao/gelbooru.com/index.php?page=dapi&s=post&q=index&id=" + myurl[1], function (response) {
                                    var gelbooru_thumbnail = response.getElementsByTagName("post")[0].attributes["preview_url"].value;
                                    var gelbooru_id = response.getElementsByTagName("post")[0].attributes["id"].value;
                                    var elem = document.createElement("div");
                                    elem.setAttribute("style", "margin-top: 5px;");
                                    createImageLink(elem, gelbooru_thumbnail, "http://gelbooru.com/index.php?page=post&s=view&id=" + gelbooru_id);
                                    node.parentNode.insertBefore(elem, node.nextSibling);
                                }, true);
                            } catch (e) {
                                window.console.log("JA(6): "+e)
                                //alert("oops!"+e);
                            }
                        })(node);
                    } else if (myurl = /http:\/\/omploader\.org\/(v|i)(.+)(\/.+|)/
                        .exec(node.href)) { // OMPLoader.org
                        var elem = document.createElement("div");
                        elem.setAttribute("style", "margin-top: 5px;");
                        createImageLink(elem, myurl[2], myurl[0]);
                        node.parentNode.insertBefore(elem,
                            node.nextSibling);
                    } else if (node.href.indexOf("i.juick.com") != -1) {
                        // do nothing
                    } else if (myurl = /http:\/\/(.*)\.(jpg|png|gif)/.exec(node.href.toLowerCase())) {
                        //
                        // GENERIC image
                        //
                        var elem = document.createElement("div");
                        elem.setAttribute("style", "margin-top: 5px;");
                        var imgref = node.href;
                        createImageLink(elem, imgref, imgref);
                        node.parentNode.insertBefore(elem,
                            node.nextSibling);
                    }
                }
            }

            function toggleInlineComments(msgid, then) {
                var existing = document.getElementsByClassName("comments-"+msgid);
                if (existing.length == 0) {
                    var url = "http://juick.com/"+msgid;
                    doAjaxRequest(url, function(response) {
                        window.setTimeout(function () {
                            try {
                                window.console.log("got ajax response for inline comments")
                                var resp = ""+response;
                                var ix = resp.indexOf("<ul id=\"replies\">");
                                if (ix != -1)
                                    resp = resp.substr(ix);
                                ix = resp.indexOf("<div id=\"footer\">");
                                if (ix != -1) {
                                    resp = resp.substr(0, ix);
                                }
                                var doc = parseHTML(resp);
                                var comments = new Array();
                                var dest = document.getElementById("msg-"+msgid);
                                if (dest) {
                                    for(var i=1; i<900; i++) {
                                        var comm = doc.getElementById(""+i);
                                        if (comm) {
                                            var header = getText(comm.getElementsByClassName("msg-header")[0]);
                                            var txt = getText(comm.getElementsByClassName("msg-txt")[0]);
                                            //alert("header="+header)
                                            var newDiv = document.createElement("div");
                                            var newHdr = document.createElement("span");
                                            newHdr.appendChild(document.createTextNode(header+" "));
                                            newHdr.style.fontWeight = "bold";
                                            var newTxt = document.createElement("span");
                                            newTxt.appendChild(document.createTextNode(txt));
                                            newDiv.appendChild(newHdr);
                                            newDiv.appendChild(newTxt);
                                            newDiv.style.paddingLeft = "60px";
                                            newDiv.style.fontSize = "smaller";
                                            newDiv.setAttribute("class", "comments-"+msgid);
                                            dest.appendChild(newDiv);
                                        }
                                    }
                                }
                                window.console.log("done inline comments")
                                then();
                            } catch (e) {
                                window.console.log("JA(7): "+e)
                            }
                        }, 100)
                    }, false)
                } else {
                    for(var i=existing.length-1; i>=0; i--) {
                        existing[i].parentNode.removeChild(existing[i]);
                    }
                    then();
                }
            }


            // places column with links etc to the right
            function fixColumnPosition() {
                if (columnRight) {
                    var content = document.getElementById("content");
                    if (content) {
                        if (mode == "MESSAGES") {
                            var rcol = document.getElementById("rcol");
                            rcol.style.paddingLeft = "50px"
                            var col = document.getElementById("column");
                            if (col && col.classList.length == 1) {
                                window.setTimeout(function() {
                                    //
                                    // run after original code
                                    //
                                    if (col.classList[0] == "abs") {
                                        col.style.left = "668px";
                                    } else {
                                        var newLeft = getAbsoluteLeft(content) + content.offsetWidth - 12;
                                        col.style.left = newLeft + "px";
                                    }
                                }, 5);
                            }
                        }
                    }
                }
            }


            var theme = getCookie("juick_classic_theme");
            if (!theme) theme = "bright";
            var cs = getCookie("cs");
            var continousScroll = cs ? cs != "0" : true;
            var ae = getCookie("ae");
            var autoExpand = ae ? ae != "0" : true;
            var ic = getCookie("ic");
            var inlineComments = ic ? ic != "0" : true;
            var na = getCookie("na");
            var noArabs = na ? na != "0" : false;
            var im = getCookie("im");
            var doInlineMedia = im ? im != "0" : true;
            var cr = getCookie("cr");
            var columnRight = cr ? cr != "0" : true;

            var noActionButtons = theme == "bright" || theme == "gray";

            function createOption(key, lab) {
                var opt = document.createElement("option");
                opt.setAttribute("value", key);
                opt.appendChild(document.createTextNode(lab));
                return opt;
            }


            var style = document.createElement("style");

            // make secondary toolbar not so big, so (at least initially) it looks not ugly.
            style.appendChild(document.createTextNode("#mtoolbar { width: 574px; }"));
            style.appendChild(document.createTextNode("div.title2 { width: 60%; }"));
            style.appendChild(document.createTextNode("li.msg { border-radius: 6px; }"));


            var jnotify = document.getElementsByName("jnotify");
            if (jnotify.length == 1 && jnotify[0].nodeName.toLowerCase() == "input") {
                //
                // settings page.
                //
                mode = "SETTINGS"
                var form = jnotify[0].parentNode.parentNode       // form
                //
                // adding theme selection checkbox
                //
                var p = document.createElement("p");
                var select = document.createElement("select");
                p.appendChild(select);
                select.appendChild(createOption("dark"," Dark theme [тёмная тема]"));
                select.appendChild(createOption("bright"," Sand theme [песочная тема]"));
                select.appendChild(createOption("gray"," Gray theme [светлосерая тема]"));
                select.appendChild(createOption("orig"," Original theme [родная тема]"));
                select.onchange = function () {
                    var newTheme=select.options[this.selectedIndex].value;
                    setCookie("juick_classic_theme", newTheme, 5000);
                    window.alert("Theme changed. Please reload page to see new theme.");
                }
                for(var i=0; i<3; i++) {
                    var testTheme=select.options[i].value;
                    if (testTheme == theme) {
                        select.selectedIndex = i;
                    }
                }
                form.insertBefore(p, jnotify[0].parentNode);
                //
                // column to the right
                //
                p = document.createElement("p");
                var inputCR = document.createElement("input");
                inputCR.setAttribute("type", "checkbox");
                if (columnRight)
                    inputCR.checked = true;
                p.appendChild(inputCR);
                p.appendChild(document.createTextNode(" Menu to the right side [меню справа]"));
                inputCR.onclick = function () {
                    setCookie("cr", inputCR.checked ? "1" : "0", 5000);
                }
                form.insertBefore(p, jnotify[0].parentNode);
                //
                // adding continous scroll checkbox
                //
                p = document.createElement("p");
                var inputCS = document.createElement("input");
                inputCS.setAttribute("type", "checkbox");
                if (continousScroll)
                    inputCS.checked = true;
                p.appendChild(inputCS);
                p.appendChild(document.createTextNode(" Continous Scroll [бесконечный вниз]"));
                inputCS.onclick = function () {
                    setCookie("cs", inputCS.checked ? "1" : "0", 5000);
                }
                form.insertBefore(p, jnotify[0].parentNode);
                //
                // autoexpand tree view
                //
                p = document.createElement("p");
                var inputAE = document.createElement("input");
                inputAE.setAttribute("type", "checkbox");
                if (autoExpand)
                    inputAE.checked = true;
                p.appendChild(inputAE);
                p.appendChild(document.createTextNode(" Auto-expand tree view [всегда открывать дерево комментов]"));
                inputAE.onclick = function () {
                    setCookie("ae", inputAE.checked ? "1" : "0", 5000);
                }
                form.insertBefore(p, jnotify[0].parentNode);
                //
                // nicht arabs!
                //
                p = document.createElement("p");
                var inputNA = document.createElement("input");
                inputNA.setAttribute("type", "checkbox");
                if (noArabs)
                    inputNA.checked = true;
                p.appendChild(inputNA);
                p.appendChild(document.createTextNode(" Arabs NO WAI [арабы не пройдут!]"));
                inputNA.onclick = function () {
                    setCookie("na", inputNA.checked ? "1" : "0", 5000);
                }
                form.insertBefore(p, jnotify[0].parentNode);
                //
                // inline comments
                //
                p = document.createElement("p");
                var inputIC = document.createElement("input");
                inputIC.setAttribute("type", "checkbox");
                if (inlineComments)
                    inputIC.checked = true;
                p.appendChild(inputIC);
                p.appendChild(document.createTextNode(" Allow inline comments [вгрузка комментов по клику на к-во комментов]"));
                inputIC.onclick = function () {
                    setCookie("ic", inputIC.checked ? "1" : "0", 5000);
                }
                form.insertBefore(p, jnotify[0].parentNode);
                //
                // inline media
                //
                p = document.createElement("p");
                var inputIM = document.createElement("input");
                inputIM.setAttribute("type", "checkbox");
                if (doInlineMedia)
                    inputIM.checked = true;
                p.appendChild(inputIM);
                p.appendChild(document.createTextNode(" Allow media inlining [вставлять картинки из третьих источников]"));
                inputIM.onclick = function () {
                    setCookie("im", inputIM.checked ? "1" : "0", 5000);
                }
                form.insertBefore(p, jnotify[0].parentNode);
                //
                // restyle page
                //
                if (theme == "bright") {
                }
                if (theme == "dark") {
                    style.appendChild(document.createTextNode("#content.pagetext { background: #464641; }"));
                }
            }

            style.appendChild(document.createTextNode(".msg { padding: 3px;}"));
            var backgroundColor = null;
            var linkColor = null;

            if (theme == "gray") {
                // all links
                linkColor = "#666";
                // single message
                style.appendChild(document.createTextNode("li.msg { background: #fff; }"));
                // header
                style.appendChild(document.createTextNode("#nav-right a { color: #afafaf; }"));
                style.appendChild(document.createTextNode("#hwrapper { background: #c3c3c3; }"));
                style.appendChild(document.createTextNode("#header label { color: #666; }"));
                backgroundColor = "#f9f9f9";
            }
            if (theme == "bright") {
                // single message
                linkColor = "#b07131";
                style.appendChild(document.createTextNode("li.msg { background: #eeeedf; }"));
                // header
                style.appendChild(document.createTextNode("#hwrapper { background: #b2b283; }"));
                style.appendChild(document.createTextNode("#header label { color: black; }"));
                backgroundColor = "#cbcb9c";
            }
            if (theme == "dark") {
                linkColor = "#b07131";
                style.appendChild(document.createTextNode("#mtoolbar { background: #31312f; }"));
                style.appendChild(document.createTextNode("html { background: black; }"));
                style.appendChild(document.createTextNode("li.msg, .title2 { background: #464641; }"));
                style.appendChild(document.createTextNode(".msg { border: none; }"));
                // this is service toolbar
                style.appendChild(document.createTextNode("div { color: white; }"));
                style.appendChild(document.createTextNode("#hwrapper { background: #000000; }"));
                backgroundColor = "#000000";
            }

            if (linkColor) {
                style.appendChild(document.createTextNode("#nav-right a { color: "+linkColor+"; }"));
                style.appendChild(document.createTextNode("a { color: "+linkColor+"; }"));
            }
            if (backgroundColor) {
                style.appendChild(document.createTextNode("html { background: "+backgroundColor+";}"));
                document.body.style.backgroundColor = backgroundColor;
            }

            if (noActionButtons) {
                // remove images from main header
                var post = document.getElementById("hi-post");
                var russian = false;
                if (post) {
                    postText = getText(post.parentNode);
                    post.removeAttribute("class");
                    russian = postText == "Написать";
                    if (linkColor)
                        post.nextSibling.style.color = linkColor;
                }
                var settings = document.getElementById("hi-settings");
                if (settings) {
                    settings.removeAttribute("class");
                    setText(settings, russian ? "Настройки": "Settings");
                    if (linkColor)
                        settings.parentNode.style.color = linkColor;
                }
                var logout = document.getElementById("hi-logout");
                if (logout) {
                    logout.removeAttribute("class");
                    setText(logout,russian ? "Выйти": "Logout");
                    if (linkColor)
                        logout.parentNode.style.color = linkColor;
                }
                // fix logo
                var headIco = document.getElementById("hi-logo");
                if (headIco) {
                    headIco.removeAttribute("class");
                    var newLogo = document.createElement("IMG");
                    if (theme == "bright") {
                        newLogo.src = "http://static.juick.com/logo2.png";
                    } else {
                        newLogo.src = "http://static.juick.com/d/4/logo.png";
                    }
                    newLogo.style.width = "120px";
                    newLogo.style.height = "40px";
                    newLogo.style.maxWidth = "120px";
                    newLogo.style.maxHeight = "40px";
                    headIco.appendChild(newLogo);
                }
                style.appendChild(document.createTextNode("#nav-right a { font-weight: bold; }"));

            }


            //
            // add "powered by" image to the header
            //
            try {
                var ul = document.getElementById("header");
                if (ul && ul.nodeName.toLowerCase()=="ul") {
                    var as = ul.getElementsByTagName("A");
                    var logout = null;
                    var post = null;
                    for(var i=0; i<as.length; i++) {
                        if (as[i].getAttribute("href") == "/logout") {
                            logout = as[i];
                        }
                        if (as[i].getAttribute("href") == "/post") {
                            // remove "wide" attribute from post (because we added extra stuff!)
                            as[i].setAttribute("class","");
                        }
                    }
                    if (logout) {
                        var beforeLI = logout.parentNode;    // li with 'logout'
                        var newLi = document.createElement("li");
                        newLi.setAttribute("class","right");
                        var a = document.createElement("a");
                        a.href = "https://chrome.google.com/webstore/detail/juick-classic/bhbhpkhmgbffbpiicpdlipidmknajbkj";
                        a.style.padding = "0px";
                        var img = document.createElement("img");
                        img.src = "http://ja.ip.rt.ru:8080/powered_by.png";
                        img.style.maxWidth = "94px";
                        img.style.marginBottom = "2px";
                        if (theme == "bright" || theme == "gray") {
                            img.width = "0";
                        }
                        a.appendChild(img);
                        newLi.appendChild(a);
                        beforeLI.parentNode.insertBefore(newLi, beforeLI);
                        var search = document.getElementsByName("search");
                        if (search && search.length == 1 && search[0].nodeName.toLowerCase() == "input") {
                            search[0].style.width = "185px";
                        }
                    }
                }
            } catch (e) {
                window.console.log("JA(8): "+e)
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

                    if (noArabs) {
                        var arabCount = 0;
                        var russCount = 0;
                        var loCount = 0;
                        var arra = "";
                        var codes = "";
                        var text = getText(msgtxt);
                        for(var i=0; i<text.length; i++) {
                            var charCode = text.charCodeAt(i);
                            if (charCode == 1055) { // long dash
                                loCount++;
                            } else if (charCode >= 0x600) {
                                arabCount++;
                                arra += text.charAt(i);
                            } else if (charCode >= 0x400 && charCode < 0x450) {
                                russCount++;
                            } else {
                                loCount++;
                            }
                            codes += " "+charCode;
                        }
                        if (arabCount > russCount && arabCount > 10) {
                            message.style.display = "none";
                        }
                    }


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
                        if (inlineComments) {
                            if (commentz.firstChild.nodeName.toLowerCase() == "a") {
                                // link to comments
                                var link = commentz.firstChild;
                                link.onmousedown = function(ev) {
                                    if (ev.button == 0) {
                                        var oldHref = link.href;
                                        link.href = "javascript:;";
                                        window.setTimeout(function() {
                                            link.href = oldHref;
                                        }, 500);
                                        window.setTimeout(function() {
                                            link.style.display = "none";
                                            var text = document.createTextNode("Loading..");
                                            link.parentNode.insertBefore(text, link);
                                            toggleInlineComments(msgid, function() {
                                                link.parentNode.removeChild(text);
                                                link.style.display = "";
                                            });
                                        }, 100);
                                        return false;
                                    }
                                };
                            }
                        }
                        theA.setAttribute("style", "padding-right: 10px;")
                        // 'A' before list of commenters
                        commentz.insertBefore(theA, commentz.firstChild);
                        commentz.appendChild(theSpan);
                    }
                    if (doInlineMedia)
                        inlineMedia(message);
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
                    if (!links) {
                        links = message.getElementsByClassName("msg-comments")[0];  // tree view
                    }
                    if (links) {
                        msgts.style.display = "none";
                        var theSpan = message.ownerDocument.createElement("span");
                        theSpan.setAttribute("class","msg-ts");
                        theSpan.appendChild(message.ownerDocument.createTextNode(date));
                        links.appendChild(theSpan);
                    }

                }
                if (doInlineMedia)
                    inlineMedia(message);
            }

            function maybeAddImageButton(ta, msgid, rid) {
                if (document.getElementById("postimage-"+rid) != null) {
                    // already here
                    return false;
                } else {
                    ta.style.width = rid != 0 ? "400px": "460px";
                    var theA = document.createElement("A");
                    theA.style.fontSize = "smaller";
                    var theIMG = document.createElement("IMG");
                    theIMG.id = "postimage-"+rid;
                    theIMG.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAUCAYAAACXtf2DAAAACXBIWXMAAAsTAAALEwEAmpw"+
                        "YAAACkElEQVQ4EaWUOWgUYRSAdzaneMYD7yOgpEgQlUQrJYiiiIiiIAqWsdDGWpLa1iI2aljEINjYKMZCNIkgCiIIGgQtjGSDBwg"+
                        "iahKj6/fNzgyzy8K6+ODb/3r/e/87ZoNCoZD5HwmCYAf3G7HzqKIdHfwrGKiDZlgHp2EEZuEJ1FeyU9U4FwNogLmwE/phAr7DK7g"+
                        "P09BZkwMuNEILtMM5GIWvMAk34AgsgFb4ARchKHdSEgEKWfCly+EAXIZ38AmeQS+0p42wNsLb8B4Wpc+c17OZoVC+VsOrYA8che3w"+
                        "Bx7CTRiGn6D+MseU6OAg7OPsQWp/Su9rPIC90AkzoIElMA5v4RdYByOsJHPY3AJ5MBLFhhjypxuugWm5BeZSB60wCjrUwRRYTMdyvr"+
                        "E3Bh9BfR++Gz5AZnU0ucNYZ96QQfAl86EpGhczmkrX1ViPjoXPZTFoWAOwCzpAyYKezLnh94GRdaE/nSY6ny3bM9JQNKSYGtN12EVKL"+
                        "PJKOAunYD8kQkF1fgY2JpvFiSkKJewiZi9gCHq45Et/g6LTSbgChn0P0qLx87CVe88ZrxPJRFoh+Q7YPAYaPgQDMA5NXGAI67QpXkd7"+
                        "XazVUcEiW9Dj0ZlRF2vAJJZhJno/CUYWWmb0EXl4w7Sbly6NUtPHeq3nyDywC233UtFjDCcXwNeYMvs/jMBzpAc+wwjkwHb0II2dtxB"+
                        "WQBhBYjwyso0De9zLr8F2tGAn4AtozG/Cy2nD8dwU2wgtkU4uLjLrUF7y+xRsWTtIR/6FbAabQEPVpAGFRK/EAVHMkN9BFHTg69vAnr" +
                        "4KySXm1cR7Rl78syvTvsvadGyAx6DUYlx927vZSUkEbhBFniguMTWKWg1rIhYjGPsL542BZVk3kGUAAAAASUVORK5CYII=";
                    theA.appendChild(theIMG);
                    theIMG.height = ""+ta.offsetHeight;
                    theIMG.style.background = "#FFFFFF";
                    theA.href = "/post?body=%23"+msgid+(rid != 0? "/"+rid: "")+" ";
                    ta.parentNode.insertBefore(theA, ta.nextSibling);
                    return true;
                }
            }

            function collectMessages(doc) {
                var msgs = new Array();
                try {
                    var iter = doc.evaluate("//LI[@class='msg']", doc, null, 0, null);
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
                //
                // fix content position
                //
                if (columnRight) {
                    style.appendChild(document.createTextNode("#content { padding-left: 40px; padding-right: 40px; margin: 0px;}"));
                }

                var maybeMessages = document.getElementsByClassName("msg");
                var messages = new Array(); // prevent mutations while iterating
                for (var i = 0; i < maybeMessages.length; i++) {
                    var message = maybeMessages[i];
                    if (message.nodeName.toLowerCase() == "li") {
                        messages.push(message.id);
                    }
                }
                for(var li=0; li<messages.length; li++) {
                    var message = document.getElementById(messages[li]);
                    globals.lastLi = message;
                    var msgid = processMessage(message);
                    if (msgid) {
                        globals.lastLi.msgid = msgid;
                    }
                    // new messages will be inserted after lastLi
                }
            }

            if (mode == "THREAD") {
                //
                // fixing HASH sign
                //
                var mtoolbar = document.getElementById("mtoolbar");
                var msgid = null;
                if (mtoolbar) {
                    var as = mtoolbar.getElementsByTagName("A");
                    if (as.length > 0) {
                        var a = as[0];
                        var href = a.getAttribute("href");
                        msgid = href.substr(href.lastIndexOf("/")+1);
                        a.href = ""+msgid;
                        setText(a, "#"+msgid);
                    }
                }
                var tas = document.getElementsByTagName("TEXTAREA");
                if (tas && msgid) {
                    for(var i=0;i<tas.length; i++) {
                        if ("body" == tas[i].name) {
                            (function(ta) {
                                ta.addEventListener("focus", function() {
                                    window.setTimeout(function() {  // after button is added
                                        if (maybeAddImageButton(ta,msgid, 0)) {
                                            var oldWidth = ta.offsetWidth;
                                            ta.style.width = (oldWidth - 50)+"px";
                                        }
                                    }, 200);
                                });
                            })(tas[i])
                        }
                    }
                }

                //
                // fixing missing comment self-link
                //
                var links = document.getElementsByClassName("msg-links")
                for(var i=0; i<links.length; i++) {
                    var linkz = links[i];
                    var fc = linkz.firstChild;
                    var lh = fc.nodeValue;      // text node
                    if (lh  && lh.substr(0, 1) == "/") {
                        var space = lh.indexOf(" ")
                        var rid = lh.substr(1, space);
                        lh = lh.substr(space);
                        fc.nodeValue = lh;
                        var theA = linkz.ownerDocument.createElement("a");
                        theA.setAttribute("href", "#"+rid);
                        setText(theA, "/" + rid);
                        linkz.insertBefore(theA, linkz.firstChild);

                        //
                        // XMPP reply url
                        //
                        linkz.appendChild(linkz.ownerDocument.createTextNode(" · "));
                        var jabberA = linkz.ownerDocument.createElement("A");
                        jabberA.href="xmpp:juick@juick.com?message;body=%23"+msgid+"/"+rid+" ";
                        setText(jabberA,"#");
                        linkz.appendChild(jabberA);
                        var allLinks = linkz.getElementsByTagName("A");
                        for(var l=0; l<allLinks.length; l++) {
                            var linkText = getText(allLinks[l]);
                            if (linkText == "Comment" || linkText == "Ответить") {
                                (function(oldProg, commentNode, theA, msgid, rid) {
                                    allLinks[l].onclick = function() {
                                        oldProg();
                                        setText(theA, "#"+msgid+"/" + rid);
                                        var tas = commentNode.getElementsByTagName("textarea");
                                        if (tas && tas.length > 0) {
                                            var ta = tas[0];
                                            maybeAddImageButton(ta, msgid, rid);
                                        }
                                        return false;
                                    }
                                })(allLinks[l].onclick, linkz.parentNode, theA, msgid, rid);
                            }
                        }
                    } else {
                        try {
                            var lih = (""+linkz.innerHTML);
                            var maybeCommentNo = lih.match(new RegExp("showCommentForm\\((\\d+),(\\d+)\\)",""));
                            if (maybeCommentNo && maybeCommentNo.length == 3) {
                                var rid = maybeCommentNo[2];
                                var theA = linkz.ownerDocument.createElement("a");
                                theA.setAttribute("href", "#"+rid);
                                theA.appendChild(linkz.ownerDocument.createTextNode("/" + rid));
                                theA.style.paddingRight = "10px";
                                linkz.insertBefore(theA, linkz.firstChild);
                            } else {
                                alert("mcn="+maybeCommentNo+" lih="+lih);
                                alert("mcn="+maybeCommentNo.length);
                            }
                        } catch(e) {
                            window.console.log("JA(9): "+e)
                        }
                    }
                }

                var comments = collectMessages(document);
                for (var i in comments) {
                    processComment(comments[i]);
                }
                var starter = document.getElementById("msg-"+msgid);
                if (starter) {
                    inlineMedia(starter);
                }

            }

            document.body.appendChild(style);

            document.body.style.visibility = "visible";

            globals.loading = false;


            function findLastPart(doc) {
                var lastPara = null;
                try {
                    var iter = doc.evaluate("//P[@class='page']", doc, null, 0, null);
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


            if (autoExpand) {
                try {
                    var ufa = document.getElementById("unfoldall");
                    if (ufa) {
                        ufa.firstChild.onclick();
                    }
                } catch (e) {
                    window.console.log("JA(10): "+e)
                    //alert("unfold:"+e);
                }
            }

            window.addEventListener("scroll", function () {
                window.yandex_context_callbacks = [];   // slows opera down greatly
                fixColumnPosition();
            });

            if (continousScroll) {
                window.addEventListener("scroll", function () {
                    //if (globals.lastScroll && new Date().getTime() - globals.lastScroll < 500) return;
                    //globals.lastScroll = new Date().getTime();
                    var content = document.getElementById("content");
                    if (!content) return;
                    var nVScroll = document.documentElement.scrollTop || document.body.scrollTop;
                    var contentHeight = content.offsetHeight;
                    //window.document.title = "SCROLL="+(nVScroll+window.innerHeight)+" BODYHEI="+contentHeight+" SIGN="+(nVScroll + window.innerHeight - (contentHeight - window.innerHeight * 4))+" ";
                    try {
                        if (nVScroll + window.innerHeight > contentHeight - window.innerHeight * 4) {
                            // 4 pages in advance
                            if (globals.loading) return;
                            globals.loading = true;
                        } else {
                            return;
                        }
                        // prevent repeated load (if some exception happens)
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
                                try {
                                    globals.loading = false;
                                    setText(lastPart.lastA,"Older...");
                                    var resp = ""+response;
                                    ix = resp.indexOf("<div id=\"footer\">");
                                    if (ix != -1) {
                                        resp = resp.substr(0, ix);
                                    }
                                    var doc = parseHTML(resp);
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
                                    window.console.log("JA(11): "+e)
                                    //window.alert(e);
                                }
                            }, false);
                        } else {
                            //window.alert("Last part is null");
                        }
                    } catch (e) {
                        window.console.log("JA(12): "+e)
                    }
                });

            }

            fixColumnPosition()
            window.console.log("main function ended")
        } catch (e) {
            window.console.log("JA: main function: "+e)
        }
    }

    window.console.log("main_process definitiion end")
    var ua = window.navigator.userAgent;
    window.console.log("window.navigator.userAgent="+ua)

    var firefox = ua.indexOf("Gecko") != -1 && ua.indexOf("like Gecko") == -1;
    var opera = ua.indexOf("Presto") != -1;

    if (firefox) {
        window.console.log("launch process: firefox ");
        // addon entry point
        window.addEventListener("load", function() {
            if("juick_classic_initialized" in this && this.juick_classic_initialized) {
                return;
            }
            this.juick_classic_initialized = true;
            try {
                document.getElementById("appcontent")
                    .addEventListener("DOMContentLoaded", function (event) {
                        // FF addon mode
                        var doc = event.originalTarget;
                        if (doc.location.host == "juick.com" || doc.location.host == "dev.juick.com") {
                            main_process(doc, window);
                        }
                    }, true);
            } catch (e) {
                // FF greasemonkey mode
                main_process(window.document, window);
            }
        }, false);
    } else if (opera) {
        window.console.log("launch process: opera");
        try {
            opera.extension.onmessage = function (e) {
                // opera extension mode
                if (e.data.action === 'jc_load_jquery') {
                    // opera only!!
                    var script = document.createElement('script');
                    script.appendChild(document.createTextNode(e.data.script));
                    document.head.appendChild(script);
                    window.console.log('juick classic: added jquery script to page: jQuery='+window.jQuery);
                }
            }
        } finally {
            window.console.log("launch process: opera 2nd try");
            // opera tampermonkey and opera extension
            main_process(window.document, window);
        }
    } else {
        window.console.log("launch process: others (chrome)");
        // chrome
        main_process(window.document, window);
    }

} catch(e) {
    window.console.error("JA error: "+e);
    //alert("Main: "+e);
}
