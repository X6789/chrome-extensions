var Decorator = (function () {
    var _this = {};

    _this.scavenger = function (host, script, interval) {
        if (interval > 0) {
            window.setInterval(script, interval);
        } else {
            console.log(script);
        }
    };

    _this.administrator = function (host) {
        $('body').addClass('iframe-scrollbar');
        switch (host) {
            case 'news.baidu.com':
                processor_baidu();
                break;
        }
    };

    function processor_baidu() {
        $("div").delegate(".index-list-item", "mouseenter", function (event) {
            event.stopPropagation();
            $(this).css('cursor', 'pointer');
        });
        $("div").delegate(".index-list-item", "mouseleave", function (event) {
            event.stopPropagation();
            $(this).css('cursor', 'auto');
        });
        $("div").delegate(".index-list-item", "click", function (event) {
            event.stopPropagation();
            var newsId = $(this).attr('id');
            if (newsId === undefined) return;
            var url = 'https://news.baidu.com/news#/detail/' + newsId;
            tell('flush-url', {
                url: url
            })
            self.location.href = url;
        });
    }


    //send message to inject , after, sed msg to backgroud.js
    function tell(message, data) {
        chrome.extension.sendRequest({
            message: message,
            data: data
        });
    }

    return _this;
}());

var cfgs = {
    "m.huxiu.com": {
        "script": "\
                if ($('a.guide-box')) {\
                    $('a.guide-box').remove(); \
                    $('div.index-ad-box').remove();\
                    window.clearInterval(this)\
                }\
                ",
        "interval": 300
    },
    "m.toutiao.com": {
        "script": "\
                if ($('a.close')) {\
                    $('a.close').parent().remove(); \
                    window.clearInterval(this)\
                }\
                if ($('.news-banner-container')) {\
                    $('.news-banner-container').remove();\
                    $('.bottom-banner-container').remove();\
                    $('.download-text').remove();\
                    $('div.unflod-field__mask').click();\
                    window.clearInterval(this)\
                }\
                ",
        "interval": 500
    },
    "news.baidu.com": {
        "script": "\
                if ($('#share')) {\
                    $('#share').remove(); \
                    window.clearInterval(this)\
                }\
                if ($('div.swipe-backflow-container')) {\
                    $('div.swipe-backflow-container').parent().remove(); \
                    window.clearInterval(this)\
                }\
                ",
        "interval": 500
    },
    "3g.163.com": {
        "script": "\
                if ($('div.wap-header-wrap')) {\
                    $('div.wap-header-wrap').remove(); \
                    $('div.wap-footer-wrap').remove(); \
                    window.clearInterval(this)\
                }\
                if ($('div.wap-footer-wrap')) {\
                    $('div.wap-header-wrap').remove(); \
                    $('div.wap-footer-wrap').remove(); \
                    window.clearInterval(this)\
                }\
                ",
        "interval": 300
    },
    "m.jd.com": {
        "script": "\
                if ($('div#m_common_tip')) {\
                    $('div#m_common_tip').remove(); \
                    window.clearInterval(this)\
                }\
                if ($('div.download-pannel')) {\
                    $('div.download-pannel').remove(); \
                    window.clearInterval(this)\
                }\
        ",
        "interval": 300
    },
    "m.vip.com": {
        "script": "\
                if ($('div#J-download-bar')) {\
                    $('div#J-download-bar').remove(); \
                    window.clearInterval(this)\
                }\
                ",
        "interval": 300
    },
    "h5.m.taobao.com": {
        "script": "\
                if ($('div.smartbanner-wrapper')) {\
                    $('div.smartbanner-wrapper').remove(); \
                    window.clearInterval(this)\
                }\
                ",
        "interval": 500
    }
};



document.addEventListener("DOMContentLoaded", () => {
    var host = self.location.host;
    var wfl = window.frames.length;
    var pfl = parent.frames.length;

    console.log('【Decorator】 %s =>  window.frames.length: %s  parent.frames.length: %s', host, wfl, pfl)
    // host = host.match(/((?:\w+\.){2}(?:cn|:net|com\.cn|com))/)[1];

    if (cfgs[host]) {
        var script = cfgs[host]['script'];
        var interval = cfgs[host]['interval'];
        console.log("【Decorator】 %s ==== scavenger [%s] ===> %s", host, interval, script);
        Decorator.administrator(host);
        Decorator.scavenger(host, script, interval);

    } else if (window.frames.length != parent.frames.length) {
        console.log("【Decorator】 %s ==== beautifier [window.frames:%s] [parent.frames:%s]", host, wfl, pfl);
        Decorator.administrator(host);
    } else {
        console.log("【Decorator】 Currently[%s] is not a small window, so there is no need to inject Decorator", host);
    }
}, false);

















/*
    DOMSubtreeModified

     // $('#x-widget-iframe body').append("<style>::-webkit-scrollbar {width: 3px;height: 5px;}</style>");

    $.getJSON("../../config/decoration.json", function (cfgs) {
        console.log("%s => %s", host, cfgs[host])
        Decorator.executor(cfgs[host]);
    });

    if (window.frames.length != parent.frames.length) { //只有在iframe内 才执行
        Decorator.executor();
    }

    window.onbeforeunload = function () {
        return false; // This will stop the redirecting.
    }

    setTimeout(() => {
            Decorator.executor();
            $('a.close').parent().remove();
    }, 800);

    $('.news-banner-container').remove();
    $('.bottom-banner-container').remove();

    $('#share').remove();
*/