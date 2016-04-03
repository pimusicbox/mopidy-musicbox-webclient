// jQuery Mobile configuration options
// see: http://api.jquerymobile.com/1.3/global-config/
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory)
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory()
    } else {
        root.configureJQueryMobile = factory()
    }
}(this, function () {
    'use strict'

    function configureJQueryMobile () {
        $.extend($.mobile, {
            ajaxEnabled: false,
            hashListeningEnabled: false
        })
    }

    $(document).bind('mobileinit', configureJQueryMobile)

    return configureJQueryMobile
}))

