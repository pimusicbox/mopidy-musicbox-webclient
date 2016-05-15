var chai = require('chai')
var expect = chai.expect
var assert = chai.assert
chai.use(require('chai-string'))
chai.use(require('chai-jquery'))

var sinon = require('sinon')

var images = require('../../mopidy_musicbox_webclient/static/js/images.js')

describe('images', function () {
    var mopidy
    var img_element
    before(function () {
        mopidy = sinon.stub(new Mopidy({callingConvention: 'by-position-or-by-name'}))
        img_element = $('<img id="img_mock">')
    })
    beforeEach(function () {
        $(img_element).removeAttr('src')
    })

    describe('#_getArtistInfo()', function () {
        it('should get artist info from track', function () {
            var track = {
                artists: [{name: 'trackArtistMock', musicbrainz_id: 'trackArtistIDMock'}],
                album: {artists: [{name: 'albumArtistMock', musicbrainz_id: 'albumArtistIDMock'}]}
            }

            var artist = images._getArtistInfo(track)
            assert.equal(artist.name, 'trackArtistMock')
            assert.equal(artist.mbid, 'trackArtistIDMock')
        })

        it('should fall back to using album artist if track artist is not available', function () {
            var track = {
                album: {artists: [{name: 'albumArtistMock', musicbrainz_id: 'albumArtistIDMock'}]}
            }

            var artist = images._getArtistInfo(track)
            assert.equal(artist.name, 'albumArtistMock')
            assert.equal(artist.mbid, 'albumArtistIDMock')
        })

        it('should use any combination of artist info from tracks and albums', function () {
            var track = {
                artists: [{name: 'trackArtistMock'}],
                album: {artists: [{name: 'albumArtistMock', musicbrainz_id: 'albumArtistIDMock'}]}
            }

            var artist = images._getArtistInfo(track)
            assert.equal(artist.name, 'trackArtistMock')
            assert.equal(artist.mbid, 'albumArtistIDMock')
        })
    })

    describe('#_getLastFmArtistInfo', function () {
        var getInfoStub

        before(function () {
            getInfoStub = sinon.stub(images.lastFM.track, 'getInfo')
            getInfoStub.yieldsTo('success', {track: {artist: {mbid: 'mockArtistID', name: 'mockArtistName'}}})
        })
        afterEach(function () {
            getInfoStub.reset()
        })
        after(function () {
            getInfoStub.restore()
        })

        it('should retrieve artist info from last.fm using MusicBrainz ID', function () {
            var track = {
                musicbrainz_id: 'trackIDMock'
            }

            images._getLastFmArtistInfo(track).then(function (artist) {
                assert.equal(artist.mbid, 'mockArtistID')
                assert.equal(artist.name, 'mockArtistName')
            }, function (code, message) {
                assert.fail(code, '', 'Async method call did not resolve as expected')
            })
            assert(getInfoStub.calledWith({mbid: 'trackIDMock'}))
        })

        it('should retrieve artist info from last.fm using track and artist name', function () {
            var track = {
                name: 'trackNameMock',
                artists: [{name: 'trackArtistMock'}]
            }

            images._getLastFmArtistInfo(track).then(function (artist) {
                assert.equal(artist.mbid, 'mockArtistID')
                assert.equal(artist.name, 'mockArtistName')
            }, function (code, message) {
                assert.fail(code, '', 'Async method call did not resolve as expected')
            })
            assert(getInfoStub.calledWith({track: 'trackNameMock', artist: 'trackArtistMock'}))
        })

        it('should raise error if neither track MusicBrainz ID OR track AND album names are available', function () {
            var track = {
                name: 'trackNameMock'
            }

            images._getLastFmArtistInfo(track).then(function (data) {
                assert.fail(data, undefined, 'Async method call with just track name did not reject as expected')
            }, function (code, message) {
                assert.equal(code, 'none')
                assert.equal(message, 'Not enough tag information available for track to make last.fm call.')
            })

            track = {
                artists: [{name: 'trackArtistMock'}]
            }

            images._getLastFmArtistInfo(track).then(function (data) {
                assert.fail(data, undefined, 'Async method call with just artist name did not reject as expected')
            }, function (code, message) {
                assert.equal(code, 'none')
                assert.equal(message, 'Not enough tag information available for track to make last.fm call.')
            })
        })

        it('should re-raise last.fm errors', function () {
            var track = {
                musicbrainz_id: 'trackIDMock'
            }

            getInfoStub.yieldsTo('error', 'code', 'message')

            images._getLastFmArtistInfo(track).then(function (data) {
                assert.fail(data, undefined, 'Async method call did not re-raise reject as expected')
            }, function (code, message) {
                assert.equal(code, 'code')
                assert.equal(message, 'message')
            })
        })
    })

    describe('#_getLastFmAlbumInfo', function () {
        var getInfoStub

        before(function () {
            getInfoStub = sinon.stub(images.lastFM.album, 'getInfo')
            getInfoStub.yieldsTo('success', {album: {image: [{size: 'extralarge', '#text': 'mockURL'}]}})
        })
        afterEach(function () {
            getInfoStub.reset()
        })
        after(function () {
            getInfoStub.restore()
        })

        it('should retrieve album info from last.fm using MusicBrainz ID', function () {
            var track = {
                album: {musicbrainz_id: 'albumIDMock'}
            }

            images._getLastFmAlbumInfo(track).then(function (data) {
                assert.equal(data.album.image[0].size, 'extralarge')
                assert.equal(data.album.image[0]['#text'], 'mockURL')
            }, function (code, message) {
                assert.fail(code, '', 'Async method call did not resolve as expected')
            })
            assert(getInfoStub.calledWith({mbid: 'albumIDMock'}))
        })

        it('should retrieve album info from last.fm using album name and either the track or artist name', function () {
            var track = {
                album: {
                    name: 'albumNameMock',
                    artists: [{name: 'albumArtistMock'}]
                },
                artists: [{name: 'trackArtistMock'}]
            }

            images._getLastFmAlbumInfo(track).then(function (data) {
                assert.equal(data.album.image[0].size, 'extralarge')
                assert.equal(data.album.image[0]['#text'], 'mockURL')
            }, function (code, message) {
                assert.fail(code, '', 'Async method call did not resolve as expected')
            })
            assert(getInfoStub.calledWith({artist: 'trackArtistMock', album: 'albumNameMock'}))
        })

        it('should raise error if neither album MusicBrainz ID OR album AND artist names are available', function () {
            var track = {
                album: {}
            }

            images._getLastFmAlbumInfo(track).then(function (data) {
                assert.fail(data, undefined, 'Async method call with just track name did not reject as expected')
            }, function (code, message) {
                assert.equal(code, 'none')
                assert.equal(message, 'Not enough tag information available for album to make last.fm call.')
            })

            track = {
                artists: [{name: 'trackArtistMock'}]
            }

            images._getLastFmAlbumInfo(track).then(function (data) {
                assert.fail(data, undefined, 'Async method call with just artist name did not reject as expected')
            }, function (code, message) {
                assert.equal(code, 'none')
                assert.equal(message, 'Not enough tag information available for album to make last.fm call.')
            })
        })

        it('should re-raise last.fm errors', function () {
            var track = {
                album: {musicbrainz_id: 'albumIDMock'}
            }

            getInfoStub.yieldsTo('error', 'code', 'message')

            images._getLastFmAlbumInfo(track).then(function (data) {
                assert.fail(data, undefined, 'Async method call did not re-raise reject as expected')
            }, function (code, message) {
                assert.equal(code, 'code')
                assert.equal(message, 'message')
            })
        })
    })

    describe('#setAlbumImage()', function () {
        var getImagesResultMock
        var lookupResultMock
        var library
        var getImagesSpy
        var setDeprecatedAlbumImageSpy

        before(function () {
            library = {
                getImages: function () { return $.when(getImagesResultMock) },
                lookup: function () { return $.when(lookupResultMock) }
            }
            mopidy.library = library

            getImagesSpy = sinon.spy(mopidy.library, 'getImages')
            setDeprecatedAlbumImageSpy = sinon.spy(images, '_setDeprecatedAlbumImage')
        })
        afterEach(function () {
            getImagesSpy.reset()
            setDeprecatedAlbumImageSpy.reset()
        })
        after(function () {
            mopidy.library.getImages.restore()
        })

        it('should use default image if no track URI is provided', function () {
            images.setAlbumImage('', img_element, mopidy)
            expect($(img_element).prop('src')).to.endWith(images.DEFAULT_ALBUM_URL)
        })

        it('should get image from Mopidy, if available', function () {
            getImagesResultMock = {'mock:track:uri': [{uri: 'mockImageUri'}]}

            images.setAlbumImage('mock:track:uri', img_element, mopidy)

            assert.isTrue(getImagesSpy.calledOnce)
            expect($(img_element).prop('src')).to.endWith('mockImageUri')
        })

        it('should fall back to retrieving image from deprecated track.album.images', function () {
            getImagesResultMock = {'mock:track:uri': []}
            lookupResultMock = {'mock:track:uri': [{album: {images: ['mockAlbumImageUri']}}]}

            images.setAlbumImage('mock:track:uri', img_element, mopidy)

            assert.isTrue(getImagesSpy.calledOnce)
            assert.isTrue(setDeprecatedAlbumImageSpy.calledOnce)
        })

        it('should default to retrieving "extralarge" album image', function () {
            getImagesResultMock = {'mock:track:uri': []}
            lookupResultMock = {'mock:track:uri': [{album: {images: ['mockAlbumImageUri']}}]}

            images.setAlbumImage('mock:track:uri', img_element, mopidy)

            expect(setDeprecatedAlbumImageSpy.args[0]).to.include('extralarge')
        })
    })

    describe('#_setDeprecatedAlbumImage()', function () {
        var lookupResultMock
        var library

        before(function () {
            library = {
                lookup: function () { return $.when(lookupResultMock) }
            }
            mopidy.library = library
        })

        it('should use default image if no track URI is provided', function () {
            images._setDeprecatedAlbumImage('', img_element, mopidy)
            expect($(img_element).prop('src')).to.endWith(images.DEFAULT_ALBUM_URL)
        })

        it('should get image from Mopidy track.album.img_element, if available', function () {
            lookupResultMock = {'mock:track:uri': [{album: {images: ['mockAlbumImageUri']}}]}

            var lookupSpy = sinon.spy(mopidy.library, 'lookup')
            images._setDeprecatedAlbumImage('mock:track:uri', img_element, mopidy)

            assert.isTrue(lookupSpy.calledOnce)
            expect($(img_element).prop('src')).to.endWith('mockAlbumImageUri')
            mopidy.library.lookup.restore()
        })

        it('should use default image if track.album or track.artist is not available', function () {
            lookupResultMock = {'mock:track:uri': [{}]}

            var lookupSpy = sinon.spy(mopidy.library, 'lookup')
            images._setDeprecatedAlbumImage('mock:track:uri', img_element, mopidy)

            assert.isTrue(lookupSpy.calledOnce)
            expect($(img_element).prop('src')).to.endWith(images.DEFAULT_ALBUM_URL)
            mopidy.library.lookup.restore()
        })

        it('should fall back to retrieving image from last.fm if none provided by Mopidy', function () {
            lookupResultMock = {'mock:track:uri': [{album: {images: []}}]}

            var setLastFmAlbumImageStub = sinon.stub(images, '_setLastFmAlbumImage')
            images._setDeprecatedAlbumImage('mock:track:uri', img_element, mopidy)

            assert.isTrue(setLastFmAlbumImageStub.calledOnce)
            setLastFmAlbumImageStub.restore()
        })

        it('should default to retrieving "extralarge" album image', function () {
            lookupResultMock = {'mock:track:uri': [{album: {}}]}

            var setLastFmAlbumImageStub = sinon.stub(images, '_setLastFmAlbumImage')
            images._setDeprecatedAlbumImage('mock:track:uri', img_element, mopidy)

            expect(setLastFmAlbumImageStub.args[0]).to.include('extralarge')
            setLastFmAlbumImageStub.restore()
        })
    })

    describe('#_setLastFmAlbumImage()', function () {
        var getInfoResultMock
        var getInfoStub

        before(function () {
            getInfoStub = sinon.stub(images, '_getLastFmAlbumInfo')
        })
        beforeEach(function () {
            getInfoStub.reset()
        })
        after(function () {
            getInfoStub.restore()
        })

        it('should use default image if track album or track artists are not available', function () {
            images._setLastFmAlbumImage({}, img_element)
            expect($(img_element).prop('src')).to.endWith(images.DEFAULT_ALBUM_URL)
        })

        it('should use correct size for setting album image', function () {
            var track = {album: {name: 'albumMock', artists: [{name: 'artistMock'}]}}
            getInfoResultMock = {album: {image: [
                {'#text': 'mockAlbumSmallImageUri', size: 'small'},
                {'#text': 'mockAlbumMedImageUri', size: 'medium'},
                {'#text': 'mockAlbumLargeImageUri', size: 'large'}
            ]}}

            getInfoStub.returns($.when(getInfoResultMock))

            images._setLastFmAlbumImage(track, img_element, 'medium')
            expect($(img_element).prop('src')).to.endWith('mockAlbumMedImageUri')
        })

        it('should default to "extralarge" if no image size is specified', function () {
            var track = {album: {name: 'albumMock', artists: [{name: 'artistMock'}]}}
            getInfoResultMock = {album: {image: [
                {'#text': 'mockAlbumSmallImageUri', size: 'small'},
                {'#text': 'mockAlbumMedImageUri', size: 'medium'},
                {'#text': 'mockAlbumXLargeImageUri', size: 'extralarge'},
                {'#text': 'mockAlbumLargeImageUri', size: 'large'}
            ]}}

            getInfoStub.returns($.when(getInfoResultMock))

            images._setLastFmAlbumImage(track, img_element)
            expect($(img_element).prop('src')).to.endWith('mockAlbumXLargeImageUri')
        })

        it('should log last.fm errors', function () {
            var track = {album: {name: 'albumMock', artists: [{name: 'artistMock'}]}}

            getInfoStub.returns($.Deferred().reject('code', 'message'))

            var consoleStub = sinon.stub(console, 'error')
            images._setLastFmAlbumImage(track, img_element)

            assert.isTrue(consoleStub.calledWith('Error getting album info from last.fm (%s: %s)', 'code', 'message'))
            consoleStub.restore()
        })
    })

    describe('#setArtistImage()', function () {
        var getImagesResultMock
        var library
        var getImagesSpy

        before(function () {
            library = {
                getImages: function () { return $.when(getImagesResultMock) }
            }
            mopidy.library = library
            getImagesSpy = sinon.spy(mopidy.library, 'getImages')
        })
        afterEach(function () {
            getImagesSpy.reset()
        })
        after(function () {
            mopidy.library.getImages.restore()
        })

        it('should use default image if no artist URI is provided', function () {
            images.setArtistImage('', '', img_element, mopidy)
            expect($(img_element).prop('src')).to.endWith(images.DEFAULT_ARTIST_URL)
        })

        it('should get artist image from Mopidy, if available', function () {
            getImagesResultMock = {'mock:artist:uri': [{uri: 'mockImageUri'}]}

            var setArtistImageFromTrackStub = sinon.stub(images, '_setArtistImageFromTrack')
            images.setArtistImage('mock:artist:uri', 'mock:track:uri', img_element, mopidy)

            assert.isTrue(getImagesSpy.calledOnce)
            expect($(img_element).prop('src')).to.endWith('mockImageUri')
            assert.isFalse(setArtistImageFromTrackStub.called)

            setArtistImageFromTrackStub.restore()
        })

        it('should fall back to retrieving artist image from last.fm', function () {
            getImagesResultMock = {'mock:artist:uri': []}

            var setArtistImageFromTrackStub = sinon.stub(images, '_setArtistImageFromTrack')
            images.setArtistImage('mock:artist:uri', 'mock:track:uri', img_element, mopidy)

            assert.isTrue(getImagesSpy.calledOnce)
            assert.isTrue(setArtistImageFromTrackStub.calledOnce)

            setArtistImageFromTrackStub.restore()
        })
    })

    describe('#_setArtistImageFromTrack()', function () {
        var lookupResultMock
        var library
        var getInfoStub

        before(function () {
            library = {
                lookup: function () { return $.when(lookupResultMock) }
            }
            mopidy.library = library
            getInfoStub = sinon.stub(images, '_getLastFmArtistInfo')
        })
        afterEach(function () {
            getInfoStub.reset()
        })
        after(function () {
            getInfoStub.restore()
        })

        it('should set artist image from last.fm using available Mopidy track information', function () {
            lookupResultMock = {'mock:track:uri': [{album: {artists: [{name: 'artistMock'}]}}]}

            var getInfoResultMock = {mbid: 'artistIDLookupMock', name: 'artistNameMock'}
            getInfoStub.returns($.when(getInfoResultMock))
            var setLastFmArtistImageStub = sinon.stub(images, '_setLastFmArtistImage')

            images._setArtistImageFromTrack('mock:track:uri', img_element, mopidy, 'small')

            assert(getInfoStub.called)
            assert(setLastFmArtistImageStub.calledWithMatch('artistIDLookupMock'))
            setLastFmArtistImageStub.restore()
        })

        it('should set artist info from last.fm using MusicBrainz ID, if available', function () {
            lookupResultMock = {'mock:track:uri': [{album: {artists: [{musicbrainz_id: 'artistIDMock'}]}}]}

            var setLastFmArtistImageStub = sinon.stub(images, '_setLastFmArtistImage')

            images._setArtistImageFromTrack('mock:track:uri', img_element, mopidy, 'small')

            assert(setLastFmArtistImageStub.calledWithMatch('artistIDMock'))
            setLastFmArtistImageStub.restore()
        })

        it('should log last.fm errors', function () {
            lookupResultMock = {'mock:track:uri': [{album: {artists: [{name: 'artistMock'}]}}]}

            getInfoStub.returns($.Deferred().reject('code', 'message'))

            var consoleStub = sinon.stub(console, 'error')

            images._setArtistImageFromTrack('mock:track:uri', img_element, mopidy, 'small')
            assert.isTrue(consoleStub.calledWith('Error retrieving artist info from last.fm. (%s: %s)', 'code', 'message'))
            consoleStub.restore()
        })
    })

    describe('#_setLastFmArtistImage()', function () {
        var getInfoResultMock
        var getInfoStub

        before(function () {
            getInfoStub = sinon.stub(images.lastFM.artist, 'getInfo')
        })
        beforeEach(function () {
            getInfoStub.reset()
        })
        after(function () {
            getInfoStub.restore()
        })

        it('should use default image if artist MusicBrainz ID is not available', function () {
            images._setLastFmArtistImage('', img_element)
            expect($(img_element).prop('src')).to.endWith(images.DEFAULT_ARTIST_URL)
        })

        it('should use correct size for setting album image', function () {
            getInfoResultMock = {artist: {image: [
                {'#text': 'mockAlbumSmallImageUri', size: 'small'},
                {'#text': 'mockAlbumMedImageUri', size: 'medium'},
                {'#text': 'mockAlbumLargeImageUri', size: 'large'}
            ]}}

            getInfoStub.yieldsTo('success', getInfoResultMock)

            images._setLastFmArtistImage('artistIDMock', img_element, 'medium')
            expect($(img_element).prop('src')).to.endWith('mockAlbumMedImageUri')
        })

        it('should default to "extralarge" if no image size is specified', function () {
            getInfoResultMock = {artist: {image: [
                {'#text': 'mockAlbumSmallImageUri', size: 'small'},
                {'#text': 'mockAlbumMedImageUri', size: 'medium'},
                {'#text': 'mockAlbumXLargeImageUri', size: 'extralarge'},
                {'#text': 'mockAlbumLargeImageUri', size: 'large'}
            ]}}

            getInfoStub.yieldsTo('success', getInfoResultMock)

            images._setLastFmArtistImage('artistIDMock', img_element)
            expect($(img_element).prop('src')).to.endWith('mockAlbumXLargeImageUri')
        })

        it('should log last.fm errors', function () {
            getInfoStub.yieldsTo('error', 'code', 'message')

            var consoleStub = sinon.stub(console, 'error')
            images._setLastFmArtistImage('artistIDMock', img_element)

            assert.isTrue(consoleStub.calledWith('Error retrieving artist info from last.fm. (%s: %s)', 'code', 'message'))
            consoleStub.restore()
        })
    })
})
