var renderList = function (list) {
    var _out_ = [];
    _out_.push('<table border="0" cellspacing="0" cellpadding="0">');
    for (var len = list.length, i = 0; i < len; i++) {
        var item = list[i];
        _out_.push('<tr>');
        _out_.push('<td width="260" class="text-title"><a title="' + item.title + '" target="_blank" href="' + item.url + '">' + item.title + '</a></td>');
        _out_.push('<td width="70" class="text-center">' + item.progress + '</td>');
        _out_.push('<td width="70" class="text-center"><span class="js-remove btn-primary">del</span></td>');
        _out_.push('</tr>');
    }
    _out_.push('</table>');
    return _out_.join('');
};