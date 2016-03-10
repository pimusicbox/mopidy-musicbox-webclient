var chai = require('chai')
var should = chai.should()
var expect = chai.expect
var assert = chai.assert
chai.use(require('chai-string'))
chai.use(require('chai-jquery'))

var sinon = require('sinon')

var coverArt = require('../mopidy_musicbox_webclient/static/js/images.js')

var images

before(function () {
    html =
        '<span id="songelapsed" class="pull-left"></span>' +
        '<span id="songlength" class="pull-right"></span>'
    $(document).ready(function () {
        $(document.body).add(html)
    })
    mopidy = sinon.stub(new Mopidy({callingConvention: 'by-position-or-by-name'}))
    images = $('<img id="img_mock">')
})

describe('CoverArt', function () {
    describe('#getCover()', function () {
        beforeEach(function () {
            $(images).removeAttr('src')
        })

        it('should use default image if no track URI is provided', function () {
            coverArt.getCover('', images, '')
            $(images).prop('src').should.endWith('images/default_cover.png')
        })

        it('should get image from Mopidy, if available', function () {
            var getImagesResultMock = {'mock:track:uri': [{uri: 'mockImageUri'}]}
            var library = { getImages: function () { return $.when(getImagesResultMock) } }
            mopidy.library = library

            var getImagesSpy = sinon.spy(mopidy.library, 'getImages')
            coverArt.getCover('mock:track:uri', images, '')

            assert(getImagesSpy.calledOnce)
            $(images).prop('src').should.endWith('mockImageUri')
        })

        it('should fall back to retrieving image from deprecated track.album.images', function () {
            var getImagesResultMock = {'mock:track:uri': []}
            var lookupResultMock = {'mock:track:uri': [{album: {images: ['mockAlbumImageUri']}}]}
            var library = {
                getImages: function () { return $.when(getImagesResultMock) },
                lookup: function () { return $.when(lookupResultMock) }
            }
            mopidy.library = library

            var getImagesSpy = sinon.spy(mopidy.library, 'getImages')
            var getCoverFromAlbumSpy = sinon.spy(coverArt, 'getCoverFromAlbum')

            coverArt.getCover('mock:track:uri', images, '')

            assert(getImagesSpy.calledOnce)
            assert(getCoverFromAlbumSpy.calledOnce)
        })
    })

    describe('#getCoverFromAlbum()', function () {
        beforeEach(function () {
            $(images).removeAttr('src')
        })

        it('should use default image if no track URI is provided', function () {
            coverArt.getCoverFromAlbum('', images, '')
            $(images).prop('src').should.endWith('images/default_cover.png')
        })

        it('should get image from Mopidy track.album.images, if available', function () {
            var lookupResultMock = {'mock:track:uri': [{album: {images: ['mockAlbumImageUri']}}]}
            var library = {
                lookup: function () { return $.when(lookupResultMock) }
            }
            mopidy.library = library

            var lookupSpy = sinon.spy(mopidy.library, 'lookup')
            coverArt.getCoverFromAlbum('mock:track:uri', images, '')

            assert(lookupSpy.calledOnce)
            $(images).prop('src').should.endWith('mockAlbumImageUri')
        })

        it('should use default image if track.album or track.artist is not available', function () {
            var lookupResultMock = {'mock:track:uri': []}
            var library = {
                lookup: function () { return $.when(lookupResultMock) }
            }
            mopidy.library = library

            var lookupSpy = sinon.spy(mopidy.library, 'lookup')
            coverArt.getCoverFromAlbum('mock:track:uri', images, '')

            assert(lookupSpy.calledOnce)
            $(images).prop('src').should.endWith('images/default_cover.png')
        })

        it('should fall back to retrieving image from last.fm if none provided by Mopidy', function () {
            var lookupResultMock = {'mock:track:uri': [{album: {images: []}}]}
            var library = {
                lookup: function () { return $.when(lookupResultMock) }
            }
            mopidy.library = library

            var getCoverFromLastFmSpy = sinon.spy(coverArt, 'getCoverFromLastFm')
            coverArt.getCoverFromAlbum('mock:track:uri', images, '')

            assert(getCoverFromLastFmSpy.calledOnce)
        })
    })

    describe('#getCoverFromLastFm()', function () {
        beforeEach(function () {
            $(images).removeAttr('src')
        })

        it('should use default image if no track is provided', function () {
            coverArt.getCoverFromLastFm(undefined, images, '')
            $(images).prop('src').should.endWith('images/default_cover.png')
        })

        it('should fall back to using track artist if album artist is not available', function () {
            var track = {artists: [{name: 'artistMock'}]}
            var getInfoResultMock = {album: {image: []}}

            var getInfoStub = sinon.stub(coverArt.lastfm.album, 'getInfo')
            getInfoStub.returns($.when(getInfoResultMock))

            coverArt.getCoverFromLastFm(track, images, '')
            var args = getInfoStub.args
            assert(args[0][0].artist === 'artistMock')
            getInfoStub.restore()
        })

        it('should get album info from last.fm', function () {
            var track = {album: {artists: [{name: 'albumMock'}]}}
            var getInfoResultMock = {album: {image: [{'#text': 'mockAlbumImageUri', size: 'small'}]}}

            var getInfoStub = sinon.stub(coverArt.lastfm.album, 'getInfo')
            getInfoStub.yieldsTo('success', getInfoResultMock)

            coverArt.getCoverFromLastFm(track, images, 'small')
            $(images).prop('src').should.endWith('mockAlbumImageUri')
            getInfoStub.restore()
        })

        it('should log errors', function () {
            var track = {album: {artists: [{name: 'albumMock'}]}}
            var getInfoStub = sinon.stub(coverArt.lastfm.album, 'getInfo')
            getInfoStub.yieldsTo('error', 'code', 'message')

            var consoleSpy = sinon.spy(console, 'log')
            coverArt.getCoverFromLastFm(track, images, '')

            assert(consoleSpy.calledOnce)
            getInfoStub.restore()
            consoleSpy.restore()
        })
    })

    describe('#getArtistImage()', function () {
        beforeEach(function () {
            $(images).removeAttr('src')
        })

        it('should use default image if no artist is provided', function () {
            coverArt.getArtistImage('', images, '')
            $(images).prop('src').should.endWith('images/user_24x32.png')
        })

        it('should get artist info from last.fm', function () {
            var getInfoResultMock = {artist: {image: [{'#text': 'mockArtistImageUri', size: 'small'}]}}

            var getInfoStub = sinon.stub(coverArt.lastfm.artist, 'getInfo')
            getInfoStub.yieldsTo('success', getInfoResultMock)

            coverArt.getArtistImage('mockArtist', images, 'small')
            $(images).prop('src').should.endWith('mockArtistImageUri')
            getInfoStub.restore()
        })

        it('should log errors', function () {
            var getInfoStub = sinon.stub(coverArt.lastfm.artist, 'getInfo')
            getInfoStub.yieldsTo('error', 'code', 'message')

            var consoleSpy = sinon.spy(console, 'log')

            coverArt.getArtistImage('mockArtist', images, 'small')
            assert(consoleSpy.calledOnce)
            getInfoStub.restore()
            consoleSpy.restore()
        })
    })
})
