/**
 * Created with IntelliJ IDEA.
 * User: san
 * Date: 2/7/13
 * Time: 2:26 PM
 * To change this template use File | Settings | File Templates.
 */

// thanks to:
// http://my.opera.com/community/forums/topic.dml?id=1425112

// background script
var jQuery = null;
//window.alert("JA background working");
var buttonProperties = {
    disabled: false,
    title: 'JA button',
    icon: 'web/icon48.png',
    popup: {
        href: 'web/popup.html',
        width: 600,
        height: 400
    }
};

console.info("Tuta from BG");
//var button = opera.contexts.toolbar.createItem(buttonProperties);
//opera.contexts.toolbar.addItem(button);


// Load the entire jQuery script into memory as a string. Save the result so
// we don't have to keep reloading it each time a tab needs it.
// Alternatively, you could decrease memory usage by loading it each time
// a tab connects at the cost of speed
(function () {
    // do this synchronously to make sure the script is loaded before any
    // tab can ask for it.
    // I am assuming you are using the minified jQuery script and that it
    // is located in a folder named "js". Change the path to match where
    // your script is. (do use the minified script to reduce memory usage.)
    var xhr = new XMLHttpRequest();
    console.info('juick classic: xhr='+xhr);
    xhr.open('GET','http://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.js', true);
    //xhr.open('GET','web/jquery.min.js', false);
    xhr.onreadystatechange = function() {
        console.info('onreadystatechange: '+this.readyState);
        if (this.readyState == 4) {
            // Error check for fetching the URL
            if (this.status == 200 && this.responseText) {
                jQuery = ""+this.responseText;
            } else {
                opera.postError('EXTENSION ERROR: Can\'t read ');
                return false;
            }
        }
    }
    xhr.send(null);

//    if (xhr.status == 200) {
//        console.info('juick classic: loaded jquery');
//        jQuery = xhr.responseText;
//    } else {
//        console.info('juick classic: Failed to load jQuery: '+xhr.status);
//    }
})();

// Each time a tab connects, send it the jQuery script
function onconnect(e) {
    if (jQuery == null) {
        console.info('juick classic: onconnect: no jquery yet');
        window.setTimeout(function() {onconnect(e);}, 500);
        return;
    }
    console.info('juick classic: onconnect: got jquery');
    e.source.postMessage({
        action: 'jc_load_jquery',
        script: jQuery
    });
}
opera.extension.onconnect = onconnect;
