// ==UserScript==
// @name        Juick Classic
// @namespace   com.juickadvanced
// @description Juick Classic Style
// @include     http://juick.com/*
// @include     http://dev.juick.com/*
// @grant 	none
// @version     1.10
// ==/UserScript==

// mozilla guid 41ee170c-9409-43b7-898d-c5de44b553db
// https://arantius.com/misc/greasemonkey/script-compiler.php


try {
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

    function parseHTML(response) {
        var doc = document.implementation.createHTMLDocument('');
        if (firefox || opera) {
            //
            // HTML parsed like this is safe, because it's detached HTML (javascript is not executed etc), good for xpath though.
            // I could not find other ways to parse HTML page for subsequent xpath querying in Firefox.
            doc.body.innerHTML = response;
        } else {
            doc.write(response);
        }
        return doc;
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
        var full_image = true;
        for (var li = 0; li < all_links.length; li++) {
            var node = all_links[li];

            if (tubeid = /youtube\.com\/watch\?v=(.+)/
                .exec(node.href)) { // YouTube
                var elem = document.createElement("div");
                elem.setAttribute("style", "margin-top: 5px;");
                elem.innerHTML = '<object style="max-width: 560px; width: 100%; height: 340px;"><param name="movie" value="http://www.youtube.com/v/'
                    + tubeid[1]
                    + '&hl=ru_RU&fs=1&"></param><param name="allowFullScreen" value="true"></param><param name="wmode" value="transparent"></param><param name="allowscriptaccess" value="always"></param><embed src="http://www.youtube.com/v/'
                    + tubeid[1]
                    + '&hl=ru_RU&fs=1&" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" wmode="transparent" style="max-width: 560px; width: 100%; height: 340px;"></embed></object>';
                node.parentNode.insertBefore(elem,
                    node.nextSibling);
            } else if (tubeid = /youtu\.be\/(.+)/
                .exec(node.href)) { // YouTube
                var elem = document.createElement("div");
                elem.setAttribute("style", "margin-top: 5px;");
                elem.innerHTML = '<object style="max-width: 560px; width: 100%; height: 340px;"><param name="movie" value="http://www.youtube.com/v/'
                    + tubeid[1]
                    + '&hl=ru_RU&fs=1&"></param><param name="allowFullScreen" value="true"></param><param name="wmode" value="transparent"></param><param name="allowscriptaccess" value="always"></param><embed src="http://www.youtube.com/v/'
                    + tubeid[1]
                    + '&hl=ru_RU&fs=1&" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" wmode="transparent" style="max-width: 560px; width: 100%; height: 340px;"></embed></object>';
                node.parentNode.insertBefore(elem,
                    node.nextSibling);
            } else if (myurl = /http:\/\/(\S+)radikal\.ru\/(\S+)\.(jpg|gif|png)/
                .exec(node.href)) { // Radikal.ru
                var elem = document.createElement("div");
                elem.setAttribute("style", "margin-top: 5px;");
                elem.innerHTML = '<a href="' + myurl[0]
                    + '"><img src="http://' + myurl[1]
                    + "radikal.ru/" + myurl[2]
                    + 't.jpg" /></a>';
                node.parentNode.insertBefore(elem,
                    node.nextSibling);
            } else if (myurl = /http:\/\/(\S{0,2})imgur\.com\/(\S+)\.(jpg|gif|png)/
                .exec(node.href)) { // Imgur.com
                var elem = document.createElement("div");
                elem.setAttribute("style", "margin-top: 5px;");
                elem.innerHTML = '<a href="' + myurl[0]
                    + '"><img src="http://' + myurl[1]
                    + "imgur.com/" + myurl[2]
                    + 'l.' + myurl[3] + '" style="max-width: 100%; height: auto;"/></a>';
                node.parentNode.insertBefore(elem,
                    node.nextSibling);
            } else if (myurl = /http:\/\/img(\S+)imageshack\.us\/img(\S+)\.(jpg|gif|png)/
                .exec(node.href)) { // ImageShack
                var elem = document.createElement("div");
                elem.setAttribute("style", "margin-top: 5px;");
                elem.innerHTML = '<a href="' + myurl[0]
                    + '"><img src="http://img' + myurl[1]
                    + "imageshack.us/img" + myurl[2]
                    + '.th.' + myurl[3] + '" /></a>';
                node.parentNode.insertBefore(elem,
                    node.nextSibling);
            } else if (myurl = /http:\/\/e-shuushuu\.net\/images\/(\d+)-(\d+)-(\d+)-(\d+)\.(\S+)/
                .exec(node.href)) { // E-ShuuShuu.net
                var elem = document.createElement("div");
                elem.setAttribute("style", "margin-top: 5px;");
                elem.innerHTML = '<a href="http://e-shuushuu.net/image/' + myurl[4]
                    + '/"><img src="http://e-shuushuu.net/images/thumbs/' + myurl[1]
                    + "-" + myurl[2]+ "-" + myurl[3]+ "-" + myurl[4]
                    + '.jpeg" /></a>';
                node.parentNode.insertBefore(elem,
                    node.nextSibling);
            } else if (myurl = /http:\/\/(\S+)fastpic\.ru\/big\/(\S+)\.(jpg|png|gif)/
                .exec(node.href)) { // Fastpic.ru
                var elem = document.createElement("div");
                elem.setAttribute("style", "margin-top: 5px;");
                elem.innerHTML = '<a href="' + myurl[0]
                    + '"><img src="http://' + myurl[1] + 'fastpic.ru/thumb/' + myurl[2]
                    + '.jpeg" /></a>';
                node.parentNode.insertBefore(elem,
                    node.nextSibling);
            } else if (myurl = /http:\/\/(\S{0,})rghost\.ru\/(\S+)\/image\.png/
                .exec(node.href)) { // RGHost.ru
                var elem = document.createElement("div");
                elem.setAttribute("style", "margin-top: 5px;");
                elem.innerHTML = '<a href="' + myurl[0]
                    + '"><img src="http://' + myurl[1] + 'rghost.ru/' + myurl[1] + '/thumb.png" /></a>';
                node.parentNode.insertBefore(elem,
                    node.nextSibling);
            } else if (myurl = /http:\/\/(\S{0,})rghost\.ru\/(\S+)\.view/
                .exec(node.href)) { // RGHost.ru
                var elem = document.createElement("div");
                elem.setAttribute("style", "margin-top: 5px;");
                elem.innerHTML = '<a href="' + myurl[0]
                    + '"><img src="http://' + myurl[1] + 'rghost.ru/' + myurl[2] + '/thumb.png" /></a>';
                node.parentNode.insertBefore(elem,
                    node.nextSibling);
            } else if (myurl = /http:\/\/(\S{0,})rghost\.ru\/(\S+)\.image/
                .exec(node.href)) { // RGHost.ru
                var elem = document.createElement("div");
                elem.setAttribute("style", "margin-top: 5px;");
                elem.innerHTML = '<a href="' + myurl[0]
                    + '"><img src="http://' + myurl[1] + 'rghost.ru/' + myurl[2] + '/thumb.png" /></a>';
                node.parentNode.insertBefore(elem,
                    node.nextSibling);
            } else if (myurl = /http:\/\/(\S+)deviantart\.com\/art\/(\S+)-(\d+)/
                .exec(node.href)) { // DeviantArt
                var elem = document.createElement("div");
                elem.setAttribute("style", "margin-top: 5px;");
                elem.innerHTML = '<object width="300" height="400"><param name="movie" value="http://backend.deviantart.com/embed/view.swf" /><param name="wmode" value="transparent"></param><param name="flashvars" value="id=' + myurl[3] + '&width=1337" /><param name="allowScriptAccess" value="always" /><embed src="http://backend.deviantart.com/embed/view.swf" type="application/x-shockwave-flash" width="500" flashvars="id=' + myurl[3] + '&width=1337" height="600" wmode="transparent" allowscriptaccess="always"></embed></object>';
                node.parentNode.insertBefore(elem,
                    node.nextSibling);
            } else if (myurl = /http:\/\/yfrog\.com\/(.*)/
                .exec(node.href)) { // YFrog
                var elem = document.createElement("div");
                elem.setAttribute("style", "margin-top: 5px;");
                elem.innerHTML = '<a href="' + myurl[0]
                    + '"><img src="http://yfrog.com/' + myurl[1] + '.th.jpg" /></a>';
                node.parentNode.insertBefore(elem,
                    node.nextSibling);
            } else if (myurl = /http:\/\/(www\.|)twitpic\.com\/(.*)/
                .exec(node.href)) { // TwitPic
                var elem = document.createElement("div");
                elem.setAttribute("style", "margin-top: 5px;");
                elem.innerHTML = '<a href="' + myurl[0]
                    + '"><img src="http://twitpic.com/show/thumb/' + myurl[2] + '" /></a>';
                node.parentNode.insertBefore(elem,
                    node.nextSibling);
            } else if (myurl = /http:\/\/ipicture\.ru\/upload\/(\d+)(\/\d+|)\/(.+)\.(jpg|png|gif)/
                .exec(node.href)) { // iPicture.ru
                var elem = document.createElement("div");
                elem.setAttribute("style", "margin-top: 5px;");
                elem.innerHTML = '<a href="' + myurl[0]
                    + '"><img src="http://ipicture.ru/upload/' + myurl[1] + myurl[2] + '/thumbs/' + myurl[3] + '.' + myurl[4] + '" /></a>';
                node.parentNode.insertBefore(elem,
                    node.nextSibling);
            } else if (myurl = /http:\/\/(www.|)ljplus\.ru\/img4\/(.)\/(.)\/(.+)\/(.+)\.(jpg|gif|png)/
                .exec(node.href)) { // LJPlus
                var elem = document.createElement("div");
                elem.setAttribute("style", "margin-top: 5px;");
                elem.innerHTML = '<a href="' + myurl[0]
                    + '"><img src="http://www.ljplus.ru/img4/' + myurl[2] + '/' + myurl[3] + '/' + myurl[4] + '/th_' + myurl[5] + '.' + myurl[6] + '" /></a>';
                node.parentNode.insertBefore(elem,
                    node.nextSibling);
            } else if (myurl = /http:\/\/(.+)\.imagehost\.org\/(.+).(jpg|png|gif)/
                .exec(node.href)) { // ImageHost.org
                var elem = document.createElement("div");
                elem.setAttribute("style", "margin-top: 5px;");
                elem.innerHTML = '<a href="' + myurl[0]
                    + '"><img src="http://' + myurl[1] + '.imagehost.org/t/' + myurl[2] + '.jpg" /></a>';
                node.parentNode.insertBefore(elem,
                    node.nextSibling);
            } else if (myurl = /http:\/\/omploader\.org\/(v|i)(.+)(\/.+|)/
                .exec(node.href)) { // OMPLoader.org
                var elem = document.createElement("div");
                elem.setAttribute("style", "margin-top: 5px;");
                elem.innerHTML = '<a href="' + myurl[0]
                    + '"><img src="http://omploader.org/t' + myurl[2] + '" /></a>';
                node.parentNode.insertBefore(elem,
                    node.nextSibling);
            } else if (myurl = /http:\/\/img(\S+)imageshack\.us\/i\/(\S+)\.(jpg|gif|png)/.exec(node.href)) { // ImageShack
                //Заглушка
            } else if (myurl = node.href.match(/http:\/\/images\.4chan\.org\/(.+)\.(jpg|png|gif)/)) { // 4Chan
                //Заглушка
            }else if ((myurl = node.href.match(/(.*)\.(jpg|gif|png|jpeg)/)) && full_image) { // If nothing can help
                var elem = document.createElement("div");
                elem.setAttribute("style", "margin-top: 5px;");
                elem.innerHTML = '<a href="' + myurl[0]
                    + '"><img src="' + myurl[0] + '" style="max-width: 500px; max-height: 400px; width: auto; height: auto;" /></a>';
                node.parentNode.insertBefore(elem,
                    node.nextSibling);
            } else if ((myurl = node.href.match(/http:\/\/pics\.livejournal\.com\/(.+)\/pic\/(.+)/)) && full_image) { // LJ Pics
                var elem = document.createElement("div");
                elem.setAttribute("style", "margin-top: 5px;");
                elem.innerHTML = '<a href="' + myurl[0]
                    + '"><img src="' + myurl[0] + '" style="max-width: 500px; max-height: 400px; width: auto; height: auto;" /></a>';
                node.parentNode.insertBefore(elem,
                    node.nextSibling);
            } else if ((myurl = /http:\/\/bayimg\.com\/(.+)/
                .exec(node.href)) && full_image) { // BayImg
                var elem = document.createElement("div");
                elem.setAttribute("style", "margin-top: 5px;");
                elem.innerHTML = '<a href="' + myurl[0]
                    + '"><img src="http://bayimg.com/image/' + myurl[1].toLowerCase() + '.jpg" style="max-width: 500px; max-height: 400px; width: auto; height: auto;" /></a>';
                node.parentNode.insertBefore(elem,
                    node.nextSibling);
            } else if (node.href.indexOf("i.juick.com") != -1) {
                // do nothing
            } else if ((myurl = /http:\/\/(.*)\.(jpg|png|gif)/
                .exec(node.href.toLowerCase())) && full_image) {
                //
                // GENERIC image
                //
                var elem = document.createElement("div");
                elem.setAttribute("style", "margin-top: 5px;");
                elem.innerHTML = '<a href="' + node.href
                    + '"><img src="'+node.href+'" style="max-width: 500px; max-height: 400px; width: auto; height: auto;" /></a>';
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
                        var doc = parseHTML(response);
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
                        then();
                    } catch (e) {
                        window.alert(e);
                    }
                }, 100)
            })
        } else {
            for(var i=existing.length-1; i>=0; i--) {
                existing[i].parentNode.removeChild(existing[i]);
            }
            then();
        }
    }


    // places column with links etc to the right
    function fixColumnPosition() {
        window.setTimeout(function() {
            //
            // run after original code
            //
            if (mode == "MESSAGES") {
                var col = document.getElementById("column");
                if (col && col.classList.length == 1) {
                    if (col.classList[0] == "abs") {
                        col.style.left = "668px";
                    } else {
                        col.style.left = "800px";
                    }
                }
            }
        }, 1);
    }


    var theme = getCookie("juick_classic_theme");
    var bright = theme ? theme != "dark" : true;
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



    var style = document.createElement("style");
    style.appendChild(document.createTextNode("a { color: #b07131; }"));

    // make secondary toolbar not so big, so (at least initially) it looks not ugly.
    style.appendChild(document.createTextNode("div.title2 { width: 60%; }"));


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
        var input = document.createElement("input");
        input.setAttribute("type", "checkbox");
        if (!bright)
            input.checked = true;
        p.appendChild(input);
        p.appendChild(document.createTextNode(" Dark theme [тёмная тема]"));
        input.onclick = function () {
            if (input.checked) {
                setCookie("juick_classic_theme", "dark", 5000);
            } else {
                setCookie("juick_classic_theme", "bright", 5000);
            }
            window.alert("Theme changed. Please reload page to see new theme.");
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
        style.appendChild(document.createTextNode("#header label { color: black; }"));
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
                a.appendChild(img);
                newLi.appendChild(a);
                beforeLI.parentNode.insertBefore(newLi, beforeLI);
            }
        }
    } catch (e) {
        alert("exc="+e);
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
        if (noArabs) {
            var hiCount = 0;
            var text = getText(msgtxt);
            for(var i=0; i<text.length; i++) {
                if (text.charCodeAt(i) >= 0x600) {
                    hiCount++;
                }
            }
            if (hiCount > 5) {
                message.style.display = "none";
            }
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

            msgts.style.display = "none";
            var theSpan = message.ownerDocument.createElement("span");
            theSpan.setAttribute("class","msg-ts");
            theSpan.appendChild(message.ownerDocument.createTextNode(date));
            links.appendChild(theSpan);

        }
        if (doInlineMedia)
            inlineMedia(message);
    }

    function maybeAddImageButton(ta, msgid, rid) {
        var existingImgLink = ta.nextSibling;
        if (existingImgLink && existingImgLink.nodeName.toLowerCase() == "A") {
            // already here
        } else {
            ta.style.width = rid != 0 ? "400px": "460px";
            var theA = document.createElement("A");
            theA.style.fontSize = "smaller";
            var theIMG = document.createElement("IMG");
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
//        var leftColumn = document.getElementById("column");
//        var rcol = document.getElementById("rcol");
//        if (rcol == null) {
//            mode = "USERBLOG";
//            var wrapper = document.getElementById("wrapper");
//            if (wrapper != null) {
//                //
//                // Adding missing right column for user blog page
//                //
//                rcol = document.createElement("div");
//                rcol.style.float = "left";
//                rcol.setAttribute("id","rcol");
//                rcol.created = "true";
//                wrapper.appendChild(rcol);
//                var content = document.getElementById("content");
//                if (firefox || opera) {
//                    rcol.style.marginLeft = "680px";
//                } else {
//                    content.style.float = "left";
//                }
//            }
//        } else {
//            // fixing position for general messages
//            rcol.style.marginLeft = "-320px";
//        }
        // fixing column position

        //
        // fix content position
        //
        style.appendChild(document.createTextNode("#content { padding-left: 40px; padding-right: 40px; margin: 0px;}"));

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
                    maybeAddImageButton(tas[i],msgid, 0);
                }
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
            if (lh  && lh.substr(0, 1) == "/") {
                var space = lh.indexOf(" ")
                var rid = lh.substr(1, space);
                lh = lh.substr(space);
                fc.nodeValue = lh;
                var theA = linkz.ownerDocument.createElement("a");
                theA.setAttribute("href", "#"+rid);
                theA.appendChild(linkz.ownerDocument.createTextNode("/" + rid));
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
                        (function(oldProg, commentNode) {
                            allLinks[l].onclick = function() {
                                oldProg();
                                var tas = commentNode.getElementsByTagName("textarea");
                                if (tas && tas.length > 0) {
                                    var ta = tas[0];
                                    maybeAddImageButton(ta, msgid, rid);
                                }
                                return false;
                            }
                        })(allLinks[l].onclick, linkz.parentNode);
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
                    alert("err="+e);
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

    if (autoExpand) {
        try {
            var ufa = document.getElementById("unfoldall");
            if (ufa) {
                ufa.firstChild.onclick();
            }
        } catch (e) {
            alert("unfold:"+e);
        }
    }

    window.addEventListener("scroll", function () {
        fixColumnPosition();
    });

    if (continousScroll) {
        window.addEventListener("scroll", function () {
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
                        try {
                            globals.loading = false;
                            setText(lastPart.lastA,"Older...");
                            var doc = parseHTML(response);
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
                    });
                } else {
                    //window.alert("Last part is null");
                }
            } catch (e) {
                //window.alert(e);
            }
        });

    }

    fixColumnPosition()
} catch (e) {
    alert("global: "+e);
}