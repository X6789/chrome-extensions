var contextId,
    requestCur,
    senderCur;

function bindEvents() {
    // 响应来自content_script的message
    chrome.runtime.onMessage.addListener(function(request, sender, sendRequest) {
        if (request.type === 'bookmark-position') { // 添加/update书签
            requestCur = request;
            senderCur = sender;
        } else if (request.type === 'remove-bookmark') { // 删除书签
            //console.log('sendRequest: ' + sendRequest);
            chrome.storage.sync.remove(sender.url, function() {
                chrome.tabs.query({
                    active: true,
                    currentWindow: true
                }, function(tabs) { // 发送消息到当前tab,添加书签相关dom节点
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: 'remove-bookmark-cb'
                    });
                });
            });
        }
    });
}

function createMenu() {
    // 添加右键菜单
    var contexts = ["page", "selection", "link", "editable", "image", "video",
        "audio"
    ];
    contextId = chrome.contextMenus.create({
        "title": 'Set progress tag here',
        "contexts": contexts,
        "onclick": menuHandle
    });
}

/**
 * 点击右键菜单
 * 保存当前书签信息到storage
 */
function menuHandle() {
    //console.log('click');
    var value = {},
        key = senderCur.url,
        obj = {};

    value.pageX = requestCur.pageX;
    value.pageY = requestCur.pageY;
    value.progress = requestCur.progress;
    value.title = requestCur.title;

    obj[key] = value;
    //console.log(obj);
    chrome.storage.sync.set(obj, function() {
        //console.log('send callback');
        chrome.tabs.query({ // 查找当前tab
            active: true,
            currentWindow: true
        }, function(tabs) { // 发送消息到当前tab,添加书签相关dom节点
            chrome.tabs.sendMessage(tabs[0].id, {
                type: 'add-bookmark-cb',
                pageX: requestCur.pageX,
                pageY: requestCur.pageY
            });
        });
    });
}


function init() {
    createMenu();
    bindEvents();
}

init();
