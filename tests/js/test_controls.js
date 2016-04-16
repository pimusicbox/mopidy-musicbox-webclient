var chai = require('chai')
var expect = chai.expect
var assert = chai.assert
chai.use(require('chai-string'))
chai.use(require('chai-jquery'))

var sinon = require('sinon')

var controls = require('../../mopidy_musicbox_webclient/static/js/controls.js')
var DummyTracklist = require('./dummy_tracklist.js')

describe('controls', function () {
    var mopidy
    var div_element
    var QUEUE_TRACKS = [  // Simulate an existing queue with three tracks loaded.
        {uri: 'track:tlTrackMock1'},
        {uri: 'track:tlTrackMock2'},
        {uri: 'track:tlTrackMock3'}
    ]
    var NEW_TRACKS = [  // Simulate the user browsing to a folder with three tracks inside it.
        {uri: 'track:trackMock1'},
        {uri: 'tunein:track:trackMock2'},  // Stream
        {uri: 'track:trackMock3'}
    ]
    var addSpy

    before(function () {
        $(document.body).append('<div data-role="popup" id="popupTracks"></div>')
        $('#popupTracks').popup()  // Initialize popup
        $(document.body).data('on-track-click', 'PLAY_ALL') // Set default click action

        mopidy = sinon.stub(new Mopidy({callingConvention: 'by-position-or-by-name'}))

        var playback = {
            play: sinon.stub(),
            stop: sinon.stub()

        }
        mopidy.playback = playback
        mopidy.playback.stop.returns($.when())
        // Mock the Mopidy tracklist so that we have a predictable state to test against.
        mopidy.tracklist = new DummyTracklist()
        addSpy = sinon.spy(mopidy.tracklist, 'add')
        clearSpy = sinon.spy(mopidy.tracklist, 'clear')
    })

    beforeEach(function () {
        mopidy.tracklist.clear()
        clearSpy.reset()
        mopidy.tracklist.add({uris: getUris(QUEUE_TRACKS)})
    })

    afterEach(function () {
        mopidy.playback.play.reset()
        addSpy.reset()
    })

    after(function () {
        mopidy.tracklist.add.restore()
        mopidy.tracklist.clear.restore()
    })

    describe('#playTracks()', function () {
        it('PLAY_ALL should clear tracklist first before populating with tracks', function () {
            customTracklists[BROWSE_TABLE] = NEW_TRACKS
            controls.playTracks(PLAY_ALL, mopidy, NEW_TRACKS[0].uri, BROWSE_TABLE)
            assert(clearSpy.called)
        })

        it('should not clear tracklist for events other than PLAY_ALL', function () {
            customTracklists[BROWSE_TABLE] = NEW_TRACKS
            controls.playTracks(PLAY_NOW, mopidy, NEW_TRACKS[0].uri, BROWSE_TABLE)
            assert(clearSpy.notCalled)
        })

        it('should raise exception if trackUri parameter is not provided and "track" data attribute is empty', function () {
            assert.throw(function () { controls.playTracks('', mopidy) }, Error)

            controls.playTracks(PLAY_ALL, mopidy, NEW_TRACKS[0].uri, BROWSE_TABLE)
            assert(mopidy.playback.play.calledWithMatch({tlid: mopidy.tracklist._tlTracks[0].tlid}))
        })

        it('should raise exception if playListUri parameter is not provided and "track" data attribute is empty', function () {
            assert.throw(function () { controls.playTracks('', mopidy, NEW_TRACKS[0].uri) }, Error)

            controls.playTracks(PLAY_ALL, mopidy, NEW_TRACKS[0].uri, BROWSE_TABLE)
            assert(mopidy.playback.play.calledWithMatch({tlid: mopidy.tracklist._tlTracks[0].tlid}))
        })

        it('should raise exception if unknown tracklist action is provided', function () {
            var getTrackURIsForActionStub = sinon.stub(controls, '_getTrackURIsForAction')  // Stub to bypass earlier exception
            assert.throw(function () { controls.playTracks('99', mopidy, NEW_TRACKS[0].uri, BROWSE_TABLE) }, Error)
            getTrackURIsForActionStub.restore()
        })

        it('should use "track" and "list" data attributes as fallback if parameters are not provided', function () {
            $('#popupTracks').data('track', 'track:trackMock1')  // Simulate 'track:trackMock1' being clicked.
            $('#popupTracks').data('list', BROWSE_TABLE)
            customTracklists[BROWSE_TABLE] = NEW_TRACKS

            controls.playTracks(PLAY_ALL, mopidy)
            assert(mopidy.playback.play.calledWithMatch({tlid: mopidy.tracklist._tlTracks[0].tlid}))
        })

        it('PLAY_NOW, PLAY_NEXT, and ADD_THIS_BOTTOM should only add one track to the tracklist', function () {
            controls.playTracks(PLAY_NOW, mopidy, NEW_TRACKS[0].uri)
            assert(addSpy.calledWithMatch({at_position: 2, uris: [NEW_TRACKS[0].uri]}), 'PLAY_NOW did not add correct track')
            addSpy.reset()

            mopidy.tracklist.clear()
            mopidy.tracklist.add({uris: getUris(QUEUE_TRACKS)})

            controls.playTracks(PLAY_NEXT, mopidy, NEW_TRACKS[0].uri)
            assert(addSpy.calledWithMatch({at_position: 2, uris: [NEW_TRACKS[0].uri]}), 'PLAY_NEXT did not add correct track')
            addSpy.reset()

            mopidy.tracklist.clear()
            mopidy.tracklist.add({uris: getUris(QUEUE_TRACKS)})

            controls.playTracks(ADD_THIS_BOTTOM, mopidy, NEW_TRACKS[0].uri)
            assert(addSpy.calledWithMatch({uris: [NEW_TRACKS[0].uri]}), 'ADD_THIS_BOTTOM did not add correct track')
        })

        it('PLAY_ALL and ADD_ALL_BOTTOM should add all tracks to tracklist', function () {
            controls.playTracks(PLAY_ALL, mopidy, NEW_TRACKS[0].uri)
            assert(addSpy.calledWithMatch({uris: getUris(NEW_TRACKS)}), 'PLAY_ALL did not add correct tracks')
            addSpy.reset()

            mopidy.tracklist.clear()
            mopidy.tracklist.add({uris: getUris(QUEUE_TRACKS)})

            controls.playTracks(ADD_ALL_BOTTOM, mopidy, NEW_TRACKS[0].uri)
            assert(addSpy.calledWithMatch({uris: getUris(NEW_TRACKS)}), 'ADD_ALL_BOTTOM did not add correct tracks')
        })

        it('PLAY_NOW and PLAY_NEXT should insert track after currently playing track', function () {
            controls.playTracks(PLAY_NOW, mopidy, NEW_TRACKS[0].uri)
            assert(addSpy.calledWithMatch({at_position: 2, uris: [NEW_TRACKS[0].uri]}), 'PLAY_NOW did not insert track at correct position')
            addSpy.reset()

            mopidy.tracklist.clear()
            mopidy.tracklist.add({uris: getUris(QUEUE_TRACKS)})

            controls.playTracks(PLAY_NEXT, mopidy, NEW_TRACKS[0].uri)
            assert(addSpy.calledWithMatch({at_position: 2, uris: [NEW_TRACKS[0].uri]}), 'PLAY_NEXT did not insert track at correct position')
        })

        it('only PLAY_NOW and PLAY_ALL should trigger playback', function () {
            controls.playTracks(PLAY_NOW, mopidy, 2)
            assert(mopidy.playback.play.calledWithMatch({tlid: mopidy.tracklist._tlTracks[2].tlid}), 'PLAY_NOW did not start playback of correct track')
            mopidy.playback.play.reset()

            mopidy.tracklist.clear()
            mopidy.tracklist.add({uris: getUris(QUEUE_TRACKS)})

            controls.playTracks(PLAY_NEXT, mopidy, NEW_TRACKS[0].uri)
            assert.isFalse(mopidy.playback.play.called, 'PLAY_NEXT should not have triggered playback to start')
            mopidy.playback.play.reset()

            mopidy.tracklist.clear()
            mopidy.tracklist.add({uris: getUris(QUEUE_TRACKS)})

            controls.playTracks(ADD_THIS_BOTTOM, mopidy, NEW_TRACKS[0].uri)
            assert.isFalse(mopidy.playback.play.called, 'ADD_THIS_BOTTOM should not have triggered playback to start')
            mopidy.playback.play.reset()

            mopidy.tracklist.clear()
            mopidy.tracklist.add({uris: getUris(QUEUE_TRACKS)})

            controls.playTracks(PLAY_ALL, mopidy, NEW_TRACKS[2].uri)
            assert(mopidy.playback.play.calledWithMatch({tlid: mopidy.tracklist._tlTracks[2].tlid}), 'PLAY_ALL did not start playback of correct track')
            mopidy.playback.play.reset()

            mopidy.tracklist.clear()
            mopidy.tracklist.add({uris: getUris(QUEUE_TRACKS)})

            controls.playTracks(ADD_ALL_BOTTOM, mopidy, NEW_TRACKS[0].uri)
            assert.isFalse(mopidy.playback.play.called, 'ADD_ALL_BOTTOM should not have triggered playback to start')
            mopidy.playback.play.reset()
        })

        it('should store last action in cookie if on-track-click mode is set to "DYNAMIC"', function () {
            $(document.body).data('on-track-click', 'DYNAMIC')
            var cookieStub = sinon.stub($, 'cookie')
            controls.playTracks(PLAY_NOW, mopidy, 2)
            assert(cookieStub.calledWithMatch('onTrackClick', PLAY_NOW, {expires: 365}))
            cookieStub.reset()

            $(document.body).data('on-track-click', 'PLAY_NOW')
            controls.playTracks(PLAY_NOW, mopidy, 2)
            assert(cookieStub.notCalled)
            cookieStub.restore()
        })
    })

    describe('#getAction()', function () {
        it('should use default action if none is specified', function () {
            window.MOCK_DEFAULT = 99  // Define global variable to test against.
            $(document.body).data('on-track-click', 'MOCK_DEFAULT')
            assert.equal(controls.getAction(), 99)
        })

        it('should get action from cookie if action is set to "DYNAMIC"', function () {
            $(document.body).data('on-track-click', 'DYNAMIC')
            var cookieStub = sinon.stub($, 'cookie')
            controls.getAction()
            assert(cookieStub.called)
            cookieStub.restore()
        })

        it('should default to "PLAY_ALL" if no cookie is available for "DYNAMIC"', function () {
            $(document.body).data('on-track-click', 'DYNAMIC')
            $.removeCookie('onTrackClick')
            assert.equal(controls.getAction(), PLAY_ALL)
        })
    })

    describe('#getIconForAction()', function () {
        it('should return correct FontAwesome class for each tracklist action', function () {
            assert.equal(controls.getIconForAction(PLAY_ALL), 'fa fa-fast-forward')
            assert.equal(controls.getIconForAction(PLAY_NOW), 'fa fa-play')
            assert.equal(controls.getIconForAction(PLAY_NEXT), 'fa fa-level-down')
            assert.equal(controls.getIconForAction(ADD_THIS_BOTTOM), 'fa fa-plus-square-o')
            assert.equal(controls.getIconForAction(ADD_ALL_BOTTOM), 'fa fa-plus-square')
        })

        it('should raise error if unknown tracklist action is provided', function () {
            assert.throw(function () { controls.getIconForAction(99) }, Error)
        })

        it('should handle action identifier strings in addition to integers', function () {
            assert.equal(controls.getIconForAction('0'), 'fa fa-play')
        })

        it('should use default tracklist action if no parameter is provided', function () {
            assert.equal(controls.getIconForAction(), 'fa fa-fast-forward')
        })
    })

    describe('#_getTrackURIsForAction()', function () {
        it('should return just "trackUri" for PLAY_NOW, PLAY_NEXT, and ADD_THIS_BOTTOM', function () {
            assert.equal(controls._getTrackURIsForAction(PLAY_NOW, 'mockUri')[0], 'mockUri')
            assert.equal(controls._getTrackURIsForAction(PLAY_NEXT, 'mockUri')[0], 'mockUri')
            assert.equal(controls._getTrackURIsForAction(ADD_THIS_BOTTOM, 'mockUri')[0], 'mockUri')
        })

        it('should get tracks from "playlistUri" for PLAY_ALL, and ADD_ALL_BOTTOM', function () {
            customTracklists[BROWSE_TABLE] = NEW_TRACKS

            var tracks = controls._getTrackURIsForAction(PLAY_ALL, NEW_TRACKS[0], BROWSE_TABLE)
            assert.equal(tracks.length, NEW_TRACKS.length)
            for (var i = 0; i < tracks.length; i++) {
                assert.equal(tracks[i], NEW_TRACKS[i].uri)
            }
        })

        it('should raise error if unknown tracklist action is provided', function () {
            assert.throw(function () { controls._getTrackURIsForAction(99) }, Error)
        })

        it('should handle action identifier strings in addition to integers', function () {
            assert.equal(controls._getTrackURIsForAction('0', 'mockUri')[0], 'mockUri')
        })
    })
})
