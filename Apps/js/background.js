var Background = (function () {
    // variables ----------------------------------------------------------------
    var _this = {};
    var _status = 'init'; // init(color:gray) ready(color:red) open(color:green) suspend(color:blue)
    var _lastTab = {
        isChromePanel: true,
        tabId: -1,
        tabUrl: ''
    };
    var _visit_box = [];
    var _debug = true;
    var _filter = {
        urls: [
            'https://m.huxiu.com/*',
            'https://m.toutiao.com/*',
            'https://news.baidu.com/news#/*',
            'https://news.baidu.com/news/*',
            'http://baijiahao.baidu.com/s\?id=*',
            'https://baijiahao.baidu.com/s\?id=*',
            'https://3g.163.com/touch/news/*',
            'https://3g.163.com/news/*',
            'https://xw.qq.com/*',
            'https://www.tmall.com/*',
            'https://*.tmall.com/*',
            'https://*.m.tmall.com/*',
            'https://h5.m.taobao.com/*',
            'https://*.m.taobao.com/*',
            'https://m.jd.com/*',
            'https://*.m.jd.com/*',
            'https://m.vip.com/*',
            'https://h5.vip.com/*',
            'https://m.iqiyi.com/*',
            'https://watchlist.sina.cn/*',
        ]
    };

    var _ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1';

    // initialize ---------------------------------------------------------------
    _this.init = function () {
        // receive post messages from "inject.js" and any iframes
        chrome.extension.onRequest.addListener(onPostMessage);

        // manage when a user change tabs
        chrome.tabs.onActivated.addListener(onActivated);

        // manage when a user change tabs
        chrome.tabs.onUpdated.addListener(onUpdated);

        //linstening hotkey press events
        chrome.commands.onCommand.addListener(onHotkeyPressed);

        // browserAction setting...
        chrome.browserAction.onClicked.addListener(onWidgetClicked);

        // rewrite  user agent before request
        chrome.webRequest.onBeforeSendHeaders.addListener(setUserAgent, _filter, ['requestHeaders', 'blocking']);

        // interceptor for _filter
        chrome.webRequest.onBeforeRequest.addListener(interceptor, _filter, ["blocking"]);
    }

    // private functions --------------------------------------------------------
    function processMessage(request) {
        // process the request
        switch (request.message) {
            case 'iframes-loaded':
                messageIframesLoaded(request.data);
                break;
            case 'widget-loaded':
                messageWidgetLoaded(request.data);
                break;
            case 'back-clicked':
                messageBackClicked(request.data);
                break;
            case 'suspend-widget':
                messageSuspendWidget(request.data);
                break;
            case 'flush-url':
                messageFlushAppURL(request.data);
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

    function suspendWidget() {
        _this.tell('suspend-widget', {});
        updateWidgetStatus('suspend', false);
    }

    // Reset the previous page's widget when opening a new page
    function resetWidget() { //update 刷新页面； active 新建标签页
        if (!_lastTab.isChromePanel) {
            logDebug('   --> notify last tab [' + _lastTab.tabId + ':' + _lastTab.tabUrl + '] reset widget....');
            chrome.tabs.sendMessage(_lastTab.tabId, {
                message: 'suspend-widget',
                data: {}
            });
        }

        //update _lastTab by current tab
        chrome.tabs.query({
            active: true
        }, function (tab) {
            if (!tab && tab.length > 0) return;
            var t = tab[0];
            _lastTab.tabId = t.id;
            _lastTab.tabUrl = t.url;

            if (t.url && isBrowserURL(t.url)) {
                _lastTab.isChromePanel = true;
                updateWidgetStatus(_status, true);
            } else {
                _lastTab.isChromePanel = false;
                switch (_status) {
                    case 'init':
                        updateWidgetStatus('ready', false);
                        break;
                    case 'ready':
                        updateWidgetStatus('ready', false);
                        break;
                    case 'open':
                        updateWidgetStatus('suspend', false);
                        break;
                    case 'suspend':
                        updateWidgetStatus('suspend', false);
                        break;
                }
            }
        });
    }

    // update widget status
    function updateWidgetStatus(status, isChromePanel) {
        if (isChromePanel) {
            chrome.browserAction.setIcon({
                path: "../images/gray-icon-32.png"
            });

        } else {
            _status = status;
            switch (status) {
                case 'init':
                    chrome.browserAction.setIcon({
                        path: "../images/gray-icon-32.png"
                    });
                    break;
                case 'ready':
                    chrome.browserAction.setIcon({
                        path: "../images/red-icon-32.png"
                    });
                    break;
                case 'open':
                    chrome.browserAction.setIcon({
                        path: "../images/green-icon-32.png"
                    });
                    break;
                case 'suspend':
                    chrome.browserAction.setIcon({
                        path: "../images/blue-icon-32.png"
                    });
                    break;
            }
        }
        // alert(_status);
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

    function loadPrevious() {
        // notify ifame load last previous page (by view:'*')
        var isHome = false;
        var previousPage = _visit_box.pop();
        previousPage = _visit_box.pop();
        if (!previousPage) isHome = true;

        _this.tell('load-previous', {
            view: '*',
            previousPage: previousPage,
            isHome: isHome
        });
    }

    //set user agent before request
    function setUserAgent(details) {
        var headers = details.requestHeaders;
        for (var i = 0; i < headers.length; i++) {
            if (headers[i].name.toLowerCase() == "user-agent") {
                headers[i].value = _ua;
                break;
            }
        }
        return {
            requestHeaders: headers
        };
    }

    //request interceptor
    function interceptor(details) {
        var url = details.url;
        if (details.type == 'sub_frame') {
            _visit_box.push(url);
            if (_visit_box.length > 20) {
                _visit_box = _visit_box.slice(1, _visit_box.length)
            }
        }
    }

    function logDebug(msg) {
        if (_debug) console.log(msg);
    }

    function isBrowserURL(url) {
        if (url.startsWith('chrome://')) {
            return true;
        } else {
            return false;
        }
    }

    // messages -----------------------------------------------------------------
    function messageIframesLoaded(data) {
        loadHomePage();
    };

    function messageWidgetLoaded(data) {
        logDebug('widget has been loadded.......');
        // loadHomePage();
    }

    function messageSuspendWidget(data) {
        suspendWidget();
    }

    function messageFlushAppURL(data) {
        var visit = data.url;
        _visit_box.push(visit)
    }

    function messageBackClicked(data) {
        loadPrevious();
    }

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

    function onActivated(tab) {
        logDebug('onActivated: Current Tab => ' + tab.tabId + ' Previous Tab => ' + _lastTab.tabId);
        resetWidget();
    };

    function onUpdated(tabId, cinfo, tab) {
        if (cinfo.status == 'complete' && tab.url != _lastTab.tabUrl) {
            logDebug('onUpdated: Current Tab => ' + tabId + ' Previous Tab => ' + _lastTab.tabId);
            resetWidget();
        }
    };

    function onWidgetClicked(tab) {
        if (isBrowserURL(tab.url)) {
            // alert(_lastTab.tabId + ' -- ' + _lastTab.isChromePanel);
            return;
        }

        switch (_status) {
            case 'init':
                startWidget();
                break;
            case 'ready':
                startWidget();
                break;
            case 'suspend':
                startWidget();
                break;
            case 'open':
                suspendWidget();
                break;
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

    //interceptor backup
    function interceptor_bak(details) {
        var url = details.url;
        var pattern = /^(http|https):\/\/(.*)\.(.*)\.com\/*/i;
        var domain = url.match(pattern)[3];
        logDebug('domain: ' + domain + ' -- type: ' + details.type + ' -- url: ' + url);
        if (details.type == 'image' || details.type == 'ping') return;

        if (details.type == 'sub_frame') {
            _visit_box.push(url);
            if (_visit_box.length > 20) {
                _visit_box = _visit_box.slice(1, _visit_box.length)
            }
        }

        switch (domain) {
            case 'toutiao':
                var pattern_a = /^https:\/\/m\.toutiao\.com\/i([0-9]*)\//i;
                var pattern_b = /^https:\/\/m\.toutiao\.com\/iundefined\/*/i;
                if (pattern_a.test(url)) {
                    _lastTab.tt_id = RegExp.$1; //头条文章ID
                } else if (pattern_b.test(url)) {
                    var redirectUrl = url.replace(/undefined/g, _lastTab.tt_id); //xhr请求
                    return {
                        redirectUrl: redirectUrl
                    };
                }
            case 'baidu':
                var pattern_c = /^(http):\/\/(.*)\.(baidu)\.com\/s\?id=*/i;
                if (pattern_c.test(url)) {
                    _visit_box.pop();
                    var redirectUrl = url.replace(/http/, 'https');
                    return {
                        redirectUrl: redirectUrl
                    };
                }
        }
    }

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