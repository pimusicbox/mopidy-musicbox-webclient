var chai = require('chai')
var expect = chai.expect
var assert = chai.assert
chai.use(require('chai-string'))
chai.use(require('chai-jquery'))

var sinon = require('sinon')

var library = require('../../mopidy_musicbox_webclient/static/js/library.js')

describe('Library', function () {
    var selectID = '#selectSearchService'
    var schemesArray = ['mockScheme1', 'mockScheme2', 'mockScheme3']
    var mopidy = { getUriSchemes: function () { return $.when(schemesArray) } }

    before(function () {
        $(document.body).append('<select id="selectSearchService"></select>')
        $('#selectSearchService').selectmenu()
    })

    beforeEach(function () {
        uriHumanList = [
            ['mockScheme1', 'mockUriHuman1'],
            ['mockScheme2', 'mockUriHuman2']
        ]
    })
    describe('#getSearchSchemes()', function () {
        beforeEach(function () {
            $(selectID).empty()
        })

        it('should add human-readable options for backend schemes', function () {
            library.getSearchSchemes([], mopidy)
            assert.equal($(selectID).children().length, schemesArray.length + 1)
            expect($(selectID).children(':eq(2)')).to.have.text('mockUriHuman2')
        })

        it('should get default value from cookie', function () {
            $.cookie('searchScheme', 'mockScheme3')
            library.getSearchSchemes([], mopidy)
            expect($(selectID + ' option:selected')).to.have.value('mockScheme3')
        })

        it('should default to "all" backends if no cookie is available', function () {
            $.removeCookie('searchScheme')
            library.getSearchSchemes([], mopidy)
            expect($(selectID + ' option:selected')).to.have.value('all')
        })

        it('should capitalize first character of backend schema if no mapping is provided', function () {
            library.getSearchSchemes([], mopidy)
            expect($(selectID).children(':eq(3)')).to.have.text('MockScheme3')
        })

        it('should blacklist services that should not be searched', function () {
            library.getSearchSchemes(['mockScheme2'], mopidy)
            assert.equal($(selectID).children().length, schemesArray.length)
            expect($(selectID).children()).not.to.contain('mockScheme2')
        })
    })
})
