var $doc = $(document),
    $body = $('body'),
    $scrollElems = [$('body'), $('html')],
    $tag = null,
    tagStr = '<div id="book-mark-tag">' +
    '<span class="tag-word">Go on</span>' +
    '<i title="remove tag" class="js-delete">×</i>' +
    '</div>';

function insertBookTag(position) {
    var isFirst = $tag ? false : true,
        pageX = position.pageX,
        pageY = position.pageY;

    $tag = $tag ? $tag : $(tagStr);
    //console.log(pageX, pageY);
    $tag.css({
        top: pageY + 'px',
        left: pageX + 'px'
    });

    if (isFirst) {
        $body.append($tag);
        $tag = $('#book-mark-tag');
    }
}

function checkBookmark(e) { // 初始化时检测storage中当前页面的书签信息
    var url = location.href;
    chrome.storage.sync.get(url, function (data) {
        data = data[url];
        if (!data) {
            return;
        }

        //console.log('get: ' + JSON.stringify(data));
        insertBookTag(data);
        $scrollElems[0].animate({
            scrollTop: data.pageY
        }, 1000);

        // body scroll失败，尝试html scroll
        if ($scrollElems[0].scrollTop() !== data.pageY) {
            $scrollElems[1].animate({
                scrollTop: data.pageY
            }, 1000);
        }
    });
}

function bindEvents() {
    $doc.on('mouseup', function (e) { // 右键记录当前位置，并发送message给background
            //console.log(e.which);

            if (e.which === 3) {
                chrome.runtime.sendMessage({
                    type: 'bookmark-position',
                    pageX: e.pageX,
                    pageY: e.pageY,
                    title: document.title,
                    progress: Math.floor(e.pageY * 100 / $doc.height())
                });
            }
        })
        .on('ready', checkBookmark)
        .on('click', '#book-mark-tag .js-delete', function (e) {
            chrome.runtime.sendMessage({
                type: 'remove-bookmark'
            });
        });

    chrome.runtime.onMessage.addListener(function (request, sender, sendRequest) {
        if (request.type === 'add-bookmark-cb') {
            insertBookTag(request);
        } else if (request.type === 'remove-bookmark-cb') {
            deleteTag();
        }
    });
}

function deleteTag() {
    $tag.remove();
    $tag = null;
}

function init() {
    $tag = $('#book-mark-tag');
    if ($tag.length === 0) {
        $tag = null;
    }
    bindEvents();
}

init();