var Background = (function () {
    // variables ----------------------------------------------------------------
    var _this = {};
    var _debug = true;

    // initialize ---------------------------------------------------------------
    _this.init = function () {
        // receive post messages from "inject.js" and any iframes
        chrome.extension.onRequest.addListener(onPostMessage);

        // browserAction setting...
        chrome.browserAction.onClicked.addListener(onWidgetClicked);

        chrome.webRequest.onCompleted.addListener(setResponseHeader, _xFrameRequestFilter, ["blocking", "responseHeaders"]);
    }

    // private functions --------------------------------------------------------
    function processMessage(request) {
        // process the request
        switch (request.message) {
            case 'iframes-loaded':
                messageIframesLoaded(request.data);
                break;

            default:
                logDebug('message from inject: ' + request.message);
                break;
        }
    };

    function startWidget() {
        _this.tell('start-widget', {});
        updateWidgetStatus('open', false);
    }


    // notify : load home page on widget, when Receive a message['widget-loaded']
    function loadHomePage() {
        // notify ifame load app icons (by view:'*')
        var isHome = false;
        var mainPage = _visit_box.pop();
        if (!mainPage) isHome = true;

        _this.tell('load-mainpage', {
            view: '*',
            mainPage: mainPage,
            isHome: isHome
        });
    }


    //request interceptor
    function interceptor(details) {
        console.log("intercept url -> " + details.url);
        return {
            cancel: false
        };
    }

    function logDebug(msg) {
        if (_debug) console.log(msg);
    }

    // messages -----------------------------------------------------------------
    function messageIframesLoaded(data) {
        loadHomePage();
    };

    // events -------------------------------------------------------------------
    function onPostMessage(request, sender, sendResponse) {
        if (!request.message) return;

        // if it has a "view", it resends the message to all the frames in the current tab
        if (request.data.view) {
            _this.tell(request.message, request.data);
            return;
        }

        processMessage(request);
    };


    function onWidgetClicked(tab) {
        if (url.startsWith('chrome://')) {
            return true;
        }
    }

    function onHotkeyPressed(command) {
        switch (command) {
            case 'start_widget':
                startWidget();
                break;
            case 'stop_widget':
                suspendWidget();
                break;
            default:
                logDebug(command);
                break;
        }
    };


    // public functions ---------------------------------------------------------
    _this.tell = function (message, data) {
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

    return _this;
}());

window.addEventListener("load", function () {
    Background.init();
}, false);