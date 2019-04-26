

var Inject = (function () {
    var _this = {};
    _this.init = function () {
        // listen to the Control Center (background.js) messages
        chrome.extension.onMessage.addListener(background_onMessage);
    };
    // send a message to "background.js"
    function tell(message, data) {
        var data = data || {};
        chrome.extension.sendRequest({
            message: message,
            data: data
        });
    };

    function processMessage(request) {
        if (!request.message) return;
        switch (request.message) {
            case 'black':
                // console.log('inject ... receive  message: black');
                break;
        }
    };

    // messages coming from "background.js"
    function background_onMessage(request, sender, sendResponse) {
        processMessage(request);
    };

    return _this;
}());

var Decorator = (function () {
    var _this = {};
    //生成从minNum到maxNum的随机数
    var randomNum = function (minNum,maxNum){
        switch(arguments.length){
            case 1:
                return parseInt(Math.random()*minNum+1,10);
            break;
            case 2:
                return parseInt(Math.random()*(maxNum-minNum+1)+minNum,10);
            break;
                default:
                    return 0;
                break;
        }
    }
    _this.init = function () {
        $('body').css('background-color','rgb(90, 155, 135)');
        $('div').each(function () {
            $(this).css('background-color', 'rgb('+randomNum(85,95) +',' + randomNum(150,160) + ',' + randomNum(130,140) + ')');
        });
    }
    return _this;
}());


document.addEventListener("DOMContentLoaded", function () {
    if (window.frames.length == parent.frames.length) {　　
        Decorator.init();
        Inject.init();
    } else {
        console.log('ENV=IFrame,  URL =>: ' + window.location.href);
    }
}, false);


