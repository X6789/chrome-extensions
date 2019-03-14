var Background = (function () {
    // variables ----------------------------------------------------------------
    var _this = {};

    var _xFrameRequestFilter = {
        urls: [
            'https://www.google.com/search*',
            'https://www.baidu.com/*',
            'http://cn.bing.com/*'
        ]
    };

    var _googleSearchRequestFilter = {
        urls: [
            'https://www.google.com/url*',
        ]
    };

    var _ua = 'Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.34 (KHTML, like Gecko) Version/11.0 Mobile/15A5341f Safari/604.1';

    // initialize ---------------------------------------------------------------
    _this.init = function () {
        // receive post messages from "inject.js" and any iframes
        chrome.extension.onRequest.addListener(onPostMessage);

        //linstening hotkey press events
        chrome.commands.onCommand.addListener(onHotkeyPressed);

        //set x-frame-options for load google into iframe
        chrome.webRequest.onHeadersReceived.addListener(setResponseHeader, _xFrameRequestFilter, ["blocking", "responseHeaders"]);

        //=================  rewrite  user agent before request
        chrome.webRequest.onBeforeSendHeaders.addListener(setUserAgentBeforeRequest, _xFrameRequestFilter, ['requestHeaders', 'blocking']);

        //=================  rewrite  google search url onBeforeSendHeaders
        // chrome.webRequest.onBeforeSendHeaders.addListener(rewriteGoogleSearchURLBeforeRequest, _googleSearchRequestFilter, ['blocking', 'requestHeaders']);

        // var pattern = /^https?:\/\/www\.google\.com\/url\?.*&url=(.*)&ei=/i;
        // chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
        // 	if (pattern.test(details.url)) {
        // 		var newUrl = decodeURIComponent(RegExp.$1);
        // 		chrome.tabs.update(details.tabId, {
        // 			url: newUrl
        // 		});
        // 	}
        // });
        //=================  browserAction setting...
        chrome.browserAction.onClicked.addListener(function (tab) {
            startEasySearch();
        });
    }
    // private functions --------------------------------------------------------
    function upateCurrentTab() {};

    function processMessage(request) {
        // process the request
        switch (request.message) {
            case 'search-button-clicked':
                message_onSearchButtonClicked(request.data);
                break;
            case 'all-iframes-loaded':
                message_allIframesLoaded(request.data);
                break;
            case 'inject-script-to-iframe':
                message_onAppFrameLoaded(request.data);
                break;
        }
    };

    // start up easy search
    function startEasySearch() {
        _this.tell('start_up_easy_search', {});
    }

    // stop EasySearch
    function stopEasySearch() {
        _this.tell('stop_easy_search', {});
    }

    //set the style of body for iframe
    function injectScript2Iframe() {
        chrome.windows.getCurrent(function (currentWindow) {
            chrome.tabs.query({
                active: true,
                windowId: currentWindow.id
            }, function (activeTabs) {
                console.log("TabId:" + activeTabs[0].id + ", And windowId:" + activeTabs[0].windowId);
                chrome.tabs.executeScript(activeTabs[0].id, {
                    // file: "iframeInject.js",
                    code: "alert(11)",
                    allFrames: true
                });
            });
        });
    }

    //rewrite  google search url
    function rewriteGoogleSearchURLBeforeRequest(d) {
        var from, to;
        var headers = d.requestHeaders;
        for (var i = 0; i < headers.length; i++) {
            if (headers[i].name.toLowerCase() == "ping-from") {
                from = headers[i].value;
            }
            if (headers[i].name.toLowerCase() == "ping-to") {
                to = headers[i].value;
                headers[i].value = from;
                break;
            }
        }
        // var qs = parseURL(d.url);
        // var tURL = decodeURIComponent(qs.params.url);
        chrome.tabs.create({
            url: to
        });
        return {
            requestHeaders: headers,
            url: from
        };
    }

    //set user agent before request
    function setUserAgentBeforeRequest(d) {
        if(d.type == 'main_frame') return;
        var headers = d.requestHeaders;
        for (var i = 0; i < headers.length; i++) {
            if (headers[i].name.toLowerCase() == "user-agent") {
                headers[i].value = _ua;
                break;
            }
        }
        // $.cookie('SRCHHPGUSR', 'CW=832&CH=431&DPR=2&UTC=480&WTS=63688122150&SW=768&SH=1024');
        return {
            requestHeaders: headers
        };
    }

    //set x-frame-options for load google into iframe
    function setResponseHeader(details) {
        if(details.type == 'main_frame') return;
        if(details.url.indexOf('www.google.com')!=-1){
            for (var i = 0; i < details.responseHeaders.length; ++i) {
                if (details.responseHeaders[i].name.toLowerCase() == 'x-frame-options') {
                    details.responseHeaders.splice(i, 1);
                    return {
                        responseHeaders: details.responseHeaders
                    };
                }
            }
        }
    }

    function parseURL(url) {
        //创建一个a标签
        var a = document.createElement('a');
        //将url赋值给标签的href属性。
        a.href = url;
        return {
            source: url,
            protocol: a.protocol.replace(':', ''), //协议
            host: a.hostname, //主机名称
            port: a.port, //端口
            query: a.search, //查询字符串
            params: (function () { //查询参数
                var ret = {},
                    seg = a.search.replace(/^\?/, '').split('&'),
                    len = seg.length,
                    i = 0,
                    s;
                for (; i < len; i++) {
                    if (!seg[i]) {
                        continue;
                    }
                    s = seg[i].split('=');
                    ret[s[0]] = s[1];
                }
                return ret;
            })(),
            file: (a.pathname.match(/\/([^\/?#]+)$/i) || [, ''])[1], //文件名
            hash: a.hash.replace('#', ''), //哈希参数
            path: a.pathname.replace(/^([^\/])/, '/$1'), //路径
            relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [, ''])[1], //相对路径
            segments: a.pathname.replace(/^\//, '').split('/') //路径片段
        };
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

    function onTabActivated() {
        upateCurrentTab();
    };

    function onHotkeyPressed(command) {
        switch (command) {
            case 'start_up_easy_search':
                startEasySearch();
                break;
            case 'stop_easy_search':
                stopEasySearch();
                break;
            default:
                console.log(command);
                break;
        }

    };

    // messages -----------------------------------------------------------------
    function message_onSearchButtonClicked(data) {
        console.log('background receive messages: ..begin search keyword== ' + data.keyword);
        return;
        // create new tab for show search result
        chrome.tabs.create({
            url: "https://www.google.com/search?q=" + data.keyword
        });
    };

    function message_allIframesLoaded(data) {
        upateCurrentTab();
    };

    function message_onAppFrameLoaded(data) {
        injectScript2Iframe()
    }

    // public functions ---------------------------------------------------------
    _this.tell = function (message, data) {
        var data = data || {};

        // find the current tab and send a message to "inject.js" and all the iframes
        chrome.tabs.getSelected(null, function (tab) {
            if (!tab) return;

            chrome.tabs.sendMessage(tab.id, {
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