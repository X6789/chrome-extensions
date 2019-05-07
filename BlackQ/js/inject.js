var Inject = (function () {
    var _this = {};
    var _ex_status = 'open';
    var _host = document.location.href;
    var _style = {
        'x-gray':{
            'xb':'#302f31',
            'xc':'#979c9c',
            'xa':'#82aed8'
        },
        'x-white':{
            'xb':'#babdbd',
            'xc':'#404142',
            'xa':'#0c1db5'
        },
        'x-green':{
            'xb':'#3d7a6b',
            'xc':'#2a2b2b',
            'xa':'#201598'
        }
    }

    _this.init = function () {
        // listen to the Control Center (background.js) messages
        chrome.extension.onMessage.addListener(monitor_background_message);
        notify_background('widget-loaded',{});

        chrome.storage.local.get(['xg'], function(data){
            _ex_status = data.xg;
            console.log('==> Value currently is ' + _ex_status);

            if(_ex_status == 'close' ){//全局关闭
                return;
            }else{ //当前网页关闭插件
                chrome.storage.local.get([_host], function(data){
                    // alert(_host + ' [inject] : ' + data[_host]);
                    if(data[_host] == 'close'){
                        _ex_status = 'close';
                        return;
                    }else{
                        setBackground();
                    }
                })
            }
        });
    };

    // send a message to "background.js"
    function notify_background(message, data) {
        var data = data || {};
        chrome.extension.sendRequest({
            message: message,
            data: data
        });
    };

    // messages coming from "background.js"
    function monitor_background_message(request, sender, sendResponse) {
        if (!request.message) return;
        console.log('inject ... receive  message: ' + request.message + '  data:' + JSON.stringify(request.data));

        switch (request.message) {
            case 'set-current':
                if(_ex_status == request.data.status){
                    console.log('_ex_status: '+_ex_status + 'equal ' + request.data.status + ',  So not need setting....');

                }else if(request.data.status == 'open'){
                    _ex_status = 'open';
                    setBackground();
                    chrome.storage.local.remove(_host,function(){})
                }else if(request.data.status == 'setx'){
                    setBackground();
                }else if(request.data.status == 'close'){
                    _ex_status = 'close';
                    var xc = {};
                    xc[_host]= _ex_status;
                    chrome.storage.local.set(xc, function(){});
                    flush();
                }
                break;

            case 'set-global':
                chrome.storage.local.set({'xg': request.data.status}, function(){});
                break;
        }
    };

    function flush() {
        window.location.reload();
    }

    function setBackground() {
        chrome.storage.local.get(['style'], function(data){
            var cs = data.style;
            console.log(' set style for current page -->' + cs);

            $('body').css('background-color',_style[cs].xb);
            $('div').each(function () {
                $(this).css('background-color', _style[cs].xb);
                $(this).css('color',_style[cs].xc);
            });
            $('a').css('color',_style[cs].xa);
        });
    }


    //生成从minNum到maxNum的随机数
    function randomNum(minNum,maxNum){
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

    return _this;
}());


document.addEventListener("DOMContentLoaded", function () {
    Inject.init();
}, false);

/*
    function setBackground() {
        $('body').css('background-color','rgb(90, 155, 135)');
        $('div').each(function () {
            var element = $(this);
            $(this).css('background-color', 'rgb('+randomNum(85,95) +',' + randomNum(150,160) + ',' + randomNum(130,140) + ')');
        });
    }
*/

