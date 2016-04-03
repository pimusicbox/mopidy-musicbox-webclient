var chai = require('chai')
var expect = chai.expect
var assert = chai.assert
chai.use(require('chai-string'))
chai.use(require('chai-jquery'))

var sinon = require('sinon')

var configureJQueryMobile = require('../../mopidy_musicbox_webclient/static/js/custom_scripting.js')

describe('jQuery Defaults', function () {
    it('should disable ajax and hashListening', function () {
        expect($.mobile.ajaxEnabled).to.be.true
        expect($.mobile.hashListeningEnabled).to.be.true

        configureJQueryMobile()
        expect($.mobile.ajaxEnabled).to.be.false
        expect($.mobile.hashListeningEnabled).to.be.false
    })

    it('should bind to "mobileinit"', function () {
        var configSpy = sinon.spy(configureJQueryMobile)

        $(document).bind('mobileinit', configSpy)
        expect(configSpy.called).to.be.false
        $(document).trigger('mobileinit')
        expect(configSpy.called).to.be.true
        configSpy.reset()
    })
})
