var  Popup = (function(){
    var _this = {};
    var _host = document.location.host;
    var _ex_status = 'open';

    _this.init = function (current_url) {
        _host = current_url;
        // alert('popup init ==> ' + current_url);
        chrome.storage.local.get(['xg'], function(data){
            _ex_status = data.xg;
            _this.switch('global', _ex_status);

            if(_ex_status == 'close' ){
                _this.switch('current', _ex_status);
                return;
            }else{
                chrome.storage.local.get([_host], function(data){
                    // alert(_host + ' [popup]: ' + data[_host]);
                    if(data[_host] == 'close'){
                        _this.switch('current', 'close');
                    }else{
                        _this.switch('current', 'open');
                    }
                })
            }
        });

        chrome.storage.local.get(['style'], function(data){
            $("div[name='bg-style']").removeClass('selected');
            $("div[x_style='" + data.style + "']").addClass('selected');
        });
    }

    _this.ex = chrome.extension.getBackgroundPage();
    _this.switch = function(id, sw) {
        var target = $('#' + id);
        var old_status = target.attr('status');
        if (sw == 'open') {
            target.attr('status','open');
            target.children(".front").css("left", (target.children(".back").outerWidth() - target
                .children(".front").outerWidth()) + "px");
            target.children(".front").css("background-color", "#7ba7f7");
            target.children(".back").css("background-color", "#8787ec");

        } else {
            target.attr('status','close');
            target.children(".front").css("left", 0);
            target.children(".front").css("background-color", "lightgrey");
            target.children(".back").css("background-color", "lightgrey");
        }
        // console.log('\nelement[' + target.get(0).id + '] ' + old_status + ' => ' + target.attr('status'));
    }

    return _this;
}());


document.addEventListener("DOMContentLoaded", function () {
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
        var current_url  = tabs[0].url;
        Popup.init(current_url);
    });

    $(document).on("click", "#current", function () {
        var global_status = $('#global').attr('status');
        if (global_status == 'open') {
            var next_status = $('#current').attr('status') == 'open' ? 'close' : 'open';
            Popup.switch('current', next_status);
            Popup.ex.Background.set_current_page(next_status);
        } else {
            console.log('global_status=' + global_status + ',  so can not set open for current');
        }
    });

    $(document).on("click", "#global", function () {
        var next_status = $(this).attr('status') == 'open' ? 'close' : 'open';
        Popup.switch('global', next_status);
        Popup.ex.Background.set_global_page(next_status);

        Popup.switch('current', next_status);
        Popup.ex.Background.set_current_page(next_status);
    });

    $(document).on("click", "div[name='bg-style']", function () {
        $("div[name='bg-style']").removeClass('selected');
        $(this).addClass('selected');
        var x_style = $(this).attr('x_style');
        Popup.ex.Background.set_global_style(x_style);

        var current_status = $('#current').attr('status');
        if (current_status == 'open') {
            Popup.ex.Background.set_current_page('setx');
        } else {
            console.log('global_status=' + global_status + ',  so can not set open for current');
        }
    });

}, false);



