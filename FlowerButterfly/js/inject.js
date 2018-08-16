var Inject = (function () {
    // constants ----------------------------------------------------------------
    var ID = {
        CONTAINER: 'x-container',
        IFRAME_PREFIX: 'x-iframe-'
    };

    // variables ----------------------------------------------------------------
    var _this = {},
        _views = {},
        _switch = false,
        _debug = true,
        _container = null;

    // initialize ---------------------------------------------------------------
    _this.init = function () {
        pretreatment();
        // create the widget container
        _container = $('<div />', {
            id: ID.CONTAINER
        });
        _container.appendTo(document.body);

        // listen to the iframes/webpages message
        window.addEventListener("message", dom_onMessage, false);


        // listen to the Control Center (background.js) messages
        chrome.extension.onMessage.addListener(background_onMessage);
    };

    function pretreatment() {
        $('body').addClass('window-scrollbar');
    }

    function processMessage(request) {
        if (!request.message) return;

        switch (request.message) {
            case 'iframes-loaded':
                message_onIframeLoaded(request.data);
                break;
        }
    };

    // events -------------------------------------------------------------------
    // messages coming from iframes and the current webpage
    function dom_onMessage(event) {
        if (!event.data.message) return;

        // tell another iframe a message
        if (event.data.view) {
            tell(event.data);
        } else {
            processMessage(event.data);
        }
    };

    // messages coming from "background.js"
    function background_onMessage(request, sender, sendResponse) {
        //data.view 有值代表消息是background 发送给iframe的；  
        if (request.data.view) return;

        if (request.message == 'reset-widget') {
            processMessage(request);
        } else if (window.frames.length == parent.frames.length) { //如果当前环境(inject被注入的页面)不是iframe 则需要接收 后台消息
            processMessage(request);
        }
    };

    // listen current page click event 
    function window_onClick(event) {
        if (_switch && !$(event.target).is('#x-container')) {
            $('#x-container').removeClass('active');
            _switch = false;
            tell('suspend-widget');
        }
    }

    // messages -----------------------------------------------------------------
    function message_onStartWidget(data) {
        loadWidget('widget');
        $('#x-container').addClass('active');
        _switch = true;

        //notify background widget_loaded， after ， notify iframe load homepage by background
        tell('widget-loaded');
    };

    function message_onSuspendWidget() {
        $('#x-container').removeClass('active');
        _switch = false;
    }

    function message_onBackClickced() {
        // tell "background.js" that back btn has been clicked
        tell('back-clicked');
    };

    function message_onFlushURL(message, data) {
        // tell "background.js" that back btn has been clicked
        tell(message, data);
    };

    function message_onIframeLoaded(data) {
        var view = loadWidget(data.source);
        var allLoaded = true;
        view.isLoaded = true;
        for (var i in _views) {
            if (_views[i].isLoaded === false) allLoaded = false;
        }

        // tell "background.js" that all the frames are loaded
        if (allLoaded) tell('iframes-loaded');
    };

    // private functions --------------------------------------------------------
    function loadWidget(id) {
        // return the view if it's already created
        if (_views[id]) return _views[id];

        // iframe initial details
        var src = chrome.extension.getURL('html/iframe/' + id + '.html?view=' + id + '&_' + (new Date().getTime())),
            iframe = $('<iframe />', {
                id: ID.IFRAME_PREFIX + id,
                src: src,
                scrolling: false
            });

        // view
        _views[id] = {
            isLoaded: false,
            iframe: iframe
        };

        // add to the container
        _container.append(iframe);

        return _views[id];
    };

    // send a message to "background.js"
    function tell(message, data) {
        var data = data || {};

        // send a message to "background.js"
        chrome.extension.sendRequest({
            message: message,
            data: data
        });
    };

    function logDebug(msg) {
        if (_debug) console.log(msg);
    }

    return _this;
}());
document.addEventListener("DOMContentLoaded", function () {
    if (window.frames.length == parent.frames.length) {　　
        Inject.init();
    } else {
        console.log('ENV=IFrame,  URL =>: ' + window.location.href);
    }
}, false);