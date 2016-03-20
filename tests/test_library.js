var chai = require('chai')
var should = chai.should()
var expect = chai.expect
var assert = chai.assert
chai.use(require('chai-string'))
chai.use(require('chai-jquery'))

var sinon = require('sinon')

var library = require('../mopidy_musicbox_webclient/static/js/library.js')

var selectID = '#selectSearchService'
var schemesArray

before(function () {
    $(document.body).append('<select id="selectSearchService"></select>')
    $('#selectSearchService').selectmenu()
})
describe('Library', function () {
    describe('#getSearchSchemes()', function () {
        beforeEach(function () {
            schemesArray = ['all', 'mockScheme1', 'mockScheme2', 'mockScheme3']
            webclient = {
                getSearchSchemes: function () { return $.when(schemesArray) }
            }
            $(selectID).empty()
        })

        it('should add human-readable options for backend schemes', function () {
            uriHumanList = [['mockScheme2', 'mockUriHuman2']]

            library.getSearchSchemes()
            assert($(selectID).children().length === schemesArray.length)
            $(selectID).children(':eq(2)').should.have.text('MockUriHuman2')
        })

        it('should get default value from cookie', function () {
            $.cookie('searchScheme', 'mockScheme3')
            library.getSearchSchemes()
            $(selectID + ' option:selected').should.have.value('mockScheme3')
        })

        it('should default to "all" backends if no cookie is available', function () {
            $.removeCookie('searchScheme')
            library.getSearchSchemes()
            $(selectID + ' option:selected').should.have.value('all')
        })

        it('should capitalize first character of backend schema', function () {
            library.getSearchSchemes()
            $(selectID).children(':eq(1)').should.have.text('MockScheme1')
        })
    })
})
