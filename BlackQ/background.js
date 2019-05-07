var Background = (function () {
    // variables ----------------------------------------------------------------
    var _this = {};
    var _debug = true;

    // initialize ---------------------------------------------------------------
    _this.init = function () {
        // receive post messages from "inject.js" and any iframes
        chrome.extension.onRequest.addListener(monitor_inject_message);
        // chrome.webRequest.onCompleted.addListener(tellInjectSetBlack, {urls: ["<all_urls>"]}, ['extraHeaders', 'responseHeaders']);
        // window.localStorage.setItem('x-g','open');
        chrome.storage.local.get(['xg'], function(data){
            if(data.xg != 'close'){
                chrome.storage.local.set({'xg': 'open'}, function(){});
            }
        });
    }

    // events -------------------------------------------------------------------
    function monitor_inject_message(request, sender, sendResponse) {
        if (!request.message) return;
        switch (request.message) {
            case 'widget-loaded':
                logDebug('inject widget-loaded');
                break;
            default:
                logDebug('message from inject: ' + request.message);
                break;
        }
    };

    // functions --------------------------------------------------------
    _this.set_current_page= function (status) {
        _this.notify_inject('set-current', {'status':status});
    }

    _this.set_global_page =function(status) {
        _this.notify_inject('set-global', {'status':status});
    }

    _this.set_global_style = function(x_style){
        chrome.storage.local.set({'style': x_style}, function(){});
    }

    _this.notify_inject = function (message, data) {
        var data = data || {};
        // find the current tab and send a message to "inject.js" and all the iframes
        chrome.tabs.query({
            active: true
        }, function (tab) {
            if (!tab && tab.length > 0) return;
            if (tab[0].url)
                chrome.tabs.sendMessage(tab[0].id, {
                    message: message,
                    data: data
                });
        });
    };

    /*
    function tellInjectSetBlack(details) {
        console.log(details);
        if (details.type == 'main_frame') {
            _this.tell(details.tabId, 'black', {});
        }
    }
    */

    function logDebug(msg) {
        if (_debug) console.log(msg);
    }

    return _this;
}());

window.addEventListener("load", function () {
    Background.init();
}, false);