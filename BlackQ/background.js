var Background = (function () {
    // variables ----------------------------------------------------------------
    var _this = {};

    // initialize ---------------------------------------------------------------
    _this.init = function () {
        // chrome.webRequest.onCompleted.addListener(tellInjectSetBlack, {urls: ["<all_urls>"]}, ['extraHeaders', 'responseHeaders']);
    }
    // private functions --------------------------------------------------------
    function tellInjectSetBlack(details) {
        console.log(details);
        if(details.type == 'main_frame'){
            _this.tell(details.tabId, 'black', {});
        }
    }

    // public functions ---------------------------------------------------------
     _this.tell = function (tabId, message, data) {
            var data = data || {};
            chrome.tabs.sendMessage(tabId, {
                message: message,
                data: data
            });
    };

    return _this;
}());

window.addEventListener("load", function () {
    Background.init();
}, false);