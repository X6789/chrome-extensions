var Widget = (function () {
    // variables ----------------------------------------------------------------
    var _this = {};
    var _iframe = null;
    var _debug = true;
    var _iframeID = '"x-widget-iframe"';
    var _iframeStyle = 'scrolling="yes" frameborder="0" marginwidth="0" marginheight="0" sandbox="allow-scripts allow-same-origin allow-popups allow-forms"';

    // initialize ---------------------------------------------------------------
    _this.init = function () {
        _iframe = new IframeManager();
        _iframe.setListener(onMessage);
        $('.menu').on('click', menu_onClick);
        // loadHomePage();
    };

    // events -------------------------------------------------------------------
    function onMessage(request) {
        switch (request.message) {
            case 'load-mainpage':
                message_loadMainPage(request.data);
                break;
            case 'load-previous':
                message_loadPrevious(request.data);
                break;
        }
    };

    function menu_onClick(event) {
        switch (event.currentTarget.id) {
            case 'btn-menu':
                loadMenuPage();
                break;
            case 'btn-home':
                loadHomePage();
                break;
            case 'btn-back':
                backBtnClicked();
                break;
        }
    };

    // private functions ---------------------------------------------------------
    function app_click(event) {
        var target = event.target;
        var app = $(target).parent();
        var appURL = app.attr('data-addr');
        var appID = app.attr('id');
        var iframe = $('<iframe id= ' + _iframeID + ' src="' + appURL + '" ' + _iframeStyle + '></iframe>');

        $("#widget-content").empty();
        $('#widget-content').append(iframe);
        // $('#x-widget-iframe').on('load', decorator);
    }

    function loadPreviousPage(url) {
        var iframe = $('<iframe id= ' + _iframeID + '   src="' + url + '" ' + _iframeStyle + '></iframe>');
        $("#widget-content").empty();
        $('#widget-content').append(iframe);
        // decorator();
    }

    function syncMainepage(url) {
        var iframe = $('<iframe id= ' + _iframeID + '   src="' + url + '" ' + _iframeStyle + '></iframe>');
        $("#widget-content").empty();
        $('#widget-content').append(iframe);
        // decorator();
    }

    function decorator(event) {
        $('a.close').parent().remove();
    }

    function logDebug(msg) {
        if (_debug) console.log(msg);
    }

    // event functions ---------------------------------------------------------
    function backBtnClicked() {
        _iframe.tell('back-clicked', {});
    }

    function loadHomePage() {
        $.getJSON("../../config/application.json", function (data) {
            $("#widget-content").empty();
            $.each(data, function (i, d) {
                var app = $('<div id="a-' + i + '" name="' + d.id + '" data-addr="' + d.src + '" class="app-icon"><image height="48" width="48"  src="' + d.icon + '"></div>');
                app.bind('click', app_click);
                $("#widget-content").append(app);
            })
        });

        $('#widget-content').show();
        $('#widget-menu').hide();
        // $('.index-list-item .index-list-main-title').css('font-size', '.15em');
    }

    function loadMenuPage() {
        $('#widget-content').hide();
        $('#widget-menu').show();
    }

    // messages -----------------------------------------------------------------
    function message_loadMainPage(data) {
        logDebug('message=load-homepage from background........');
        if (data.isHome) {
            loadHomePage();
        } else {
            syncMainepage(data.mainPage);
        }
    };

    function message_loadPrevious(data) {
        logDebug('message=goto-previous from background........');
        if (data.isHome) {
            loadHomePage();
        } else {
            loadPreviousPage(data.previousPage);
        }
    };

    return _this;
}());

document.addEventListener("DOMContentLoaded", function () {
    new Widget.init();
}, false);


/*
        if (iframe.attachEvent) {
            iframe.attachEvent("onload", function () {
                alert("Local iframe is now loaded.");
                logDebug($('a.close').parent());
            });
        } else {
            iframe.onload = function () {
                alert("Local iframe is now loaded.");
                logDebug($('a.close').parent());
            };
        }
*/