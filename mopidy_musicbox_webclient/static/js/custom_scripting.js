// jQuery Mobile configuration options
// see: http://api.jquerymobile.com/1.3/global-config/
$(document).bind('mobileinit', function () {
    $.extend($.mobile, {
        ajaxEnabled: false,
        hashListeningEnabled: false
    })
})
