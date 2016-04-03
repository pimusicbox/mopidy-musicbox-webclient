var chai = require('chai')
var expect = chai.expect
var assert = chai.assert
chai.use(require('chai-string'))
chai.use(require('chai-jquery'))

var sinon = require('sinon')

var coverArt = require('../../mopidy_musicbox_webclient/static/js/images.js')

describe('CoverArt', function () {
    var mopidy
    var images
    beforeEach(function () {
        mopidy = sinon.stub(new Mopidy({callingConvention: 'by-position-or-by-name'}))
        images = $('<img id="img_mock">')
        $(images).removeAttr('src')
    })
    describe('#getCover()', function () {
        it('should use default image if no track URI is provided', function () {
            coverArt.getCover('', images, '', mopidy)
            expect($(images).prop('src')).to.endWith('images/default_cover.png')
        })

        it('should get image from Mopidy, if available', function () {
            var getImagesResultMock = {'mock:track:uri': [{uri: 'mockImageUri'}]}
            var library = { getImages: function () { return $.when(getImagesResultMock) } }
            mopidy.library = library

            var getImagesSpy = sinon.spy(mopidy.library, 'getImages')
            coverArt.getCover('mock:track:uri', images, '', mopidy)

            assert.isTrue(getImagesSpy.calledOnce)
            expect($(images).prop('src')).to.endWith('mockImageUri')
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

            coverArt.getCover('mock:track:uri', images, '', mopidy)

            assert.isTrue(getImagesSpy.calledOnce)
            assert.isTrue(getCoverFromAlbumSpy.calledOnce)
        })
    })

    describe('#getCoverFromAlbum()', function () {
        it('should use default image if no track URI is provided', function () {
            coverArt.getCoverFromAlbum('', images, '', mopidy)
            expect($(images).prop('src')).to.endWith('images/default_cover.png')
        })

        it('should get image from Mopidy track.album.images, if available', function () {
            var lookupResultMock = {'mock:track:uri': [{album: {images: ['mockAlbumImageUri']}}]}
            var library = {
                lookup: function () { return $.when(lookupResultMock) }
            }
            mopidy.library = library

            var lookupSpy = sinon.spy(mopidy.library, 'lookup')
            coverArt.getCoverFromAlbum('mock:track:uri', images, '', mopidy)

            assert.isTrue(lookupSpy.calledOnce)
            expect($(images).prop('src')).to.endWith('mockAlbumImageUri')
        })

        it('should use default image if track.album or track.artist is not available', function () {
            var lookupResultMock = {'mock:track:uri': []}
            var library = {
                lookup: function () { return $.when(lookupResultMock) }
            }
            mopidy.library = library

            var lookupSpy = sinon.spy(mopidy.library, 'lookup')
            coverArt.getCoverFromAlbum('mock:track:uri', images, '', mopidy)

            assert.isTrue(lookupSpy.calledOnce)
            expect($(images).prop('src')).to.endWith('images/default_cover.png')
        })

        it('should fall back to retrieving image from last.fm if none provided by Mopidy', function () {
            var lookupResultMock = {'mock:track:uri': [{album: {images: []}}]}
            var library = {
                lookup: function () { return $.when(lookupResultMock) }
            }
            mopidy.library = library

            var getCoverFromLastFmStub = sinon.stub(coverArt, 'getCoverFromLastFm')
            coverArt.getCoverFromAlbum('mock:track:uri', images, '', mopidy)

            assert.isTrue(getCoverFromLastFmStub.calledOnce)
            getCoverFromLastFmStub.restore()
        })
    })

    describe('#getCoverFromLastFm()', function () {
        it('should use default image if no track is provided', function () {
            coverArt.getCoverFromLastFm(undefined, images, '')
            expect($(images).prop('src')).to.endWith('images/default_cover.png')
        })

        it('should fall back to using track artist if album artist is not available', function () {
            var track = {artists: [{name: 'artistMock'}]}
            var getInfoResultMock = {album: {image: []}}

            var getInfoStub = sinon.stub(coverArt.lastfm.album, 'getInfo')
            getInfoStub.returns($.when(getInfoResultMock))

            coverArt.getCoverFromLastFm(track, images, '')
            var args = getInfoStub.args
            assert.equal(args[0][0].artist, 'artistMock')
            getInfoStub.restore()
        })

        it('should get album info from last.fm', function () {
            var track = {album: {artists: [{name: 'albumMock'}]}}
            var getInfoResultMock = {album: {image: [{'#text': 'mockAlbumImageUri', size: 'small'}]}}

            var getInfoStub = sinon.stub(coverArt.lastfm.album, 'getInfo')
            getInfoStub.yieldsTo('success', getInfoResultMock)

            coverArt.getCoverFromLastFm(track, images, 'small')
            expect($(images).prop('src')).to.endWith('mockAlbumImageUri')
            getInfoStub.restore()
        })

        it('should log errors', function () {
            var track = {album: {artists: [{name: 'albumMock'}]}}
            var getInfoStub = sinon.stub(coverArt.lastfm.album, 'getInfo')
            getInfoStub.yieldsTo('error', 'code', 'message')

            var consoleStub = sinon.stub(console, 'error')
            coverArt.getCoverFromLastFm(track, images, '')

            assert.isTrue(consoleStub.calledOnce)
            getInfoStub.restore()
            consoleStub.restore()
        })
    })

    describe('#getArtistImage()', function () {
        it('should use default image if no artist is provided', function () {
            coverArt.getArtistImage('', images, '')
            expect($(images).prop('src')).to.endWith('images/user_24x32.png')
        })

        it('should get artist info from last.fm', function () {
            var getInfoResultMock = {artist: {image: [{'#text': 'mockArtistImageUri', size: 'small'}]}}

            var getInfoStub = sinon.stub(coverArt.lastfm.artist, 'getInfo')
            getInfoStub.yieldsTo('success', getInfoResultMock)

            coverArt.getArtistImage('mockArtist', images, 'small')
            expect($(images).prop('src')).to.endWith('mockArtistImageUri')
            getInfoStub.restore()
        })

        it('should log errors', function () {
            var getInfoStub = sinon.stub(coverArt.lastfm.artist, 'getInfo')
            getInfoStub.yieldsTo('error', 'code', 'message')

            var consoleStub = sinon.stub(console, 'error')

            coverArt.getArtistImage('mockArtist', images, 'small')
            assert.isTrue(consoleStub.calledOnce)
            getInfoStub.restore()
            consoleStub.restore()
        })
    })
})
