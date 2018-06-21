document.addEventListener('DOMContentLoaded', function () {
    loadStorage();
    bindEvents();
});

function loadStorage() {
    chrome.storage.sync.get(null, function (data) {
        var list = [],
            prop,
            html;
        //console.log(data);
        for (prop in data) {
            if (data.hasOwnProperty(prop)) {
                if (data[prop].pageX !== undefined) {
                    list.push($.extend({}, data[prop], {
                        url: prop
                    }));
                }
            }
        }

        html = renderList(list);
        $('#content').html(html);
    });
}

function bindEvents() {
    $(document).on('click', '.js-remove', function (e) {
        //console.log('click remove');
        var $this = $(this),
            $link = $this.closest('tr').find('.text-title a'),
            url = $link.attr('href');
        chrome.storage.sync.remove(url, function () {
            loadStorage();
        });
    });
}