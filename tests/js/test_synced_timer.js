var chai = require('chai')
var expect = chai.expect
var assert = chai.assert
chai.use(require('chai-string'))
chai.use(require('chai-jquery'))

var sinon = require('sinon')

var SyncedProgressTimer = require('../../mopidy_musicbox_webclient/static/js/synced_timer.js')

describe('SyncedTimer', function () {
    var MAX_ATTEMPTS = 8
    var syncedProgressTimer
    var mopidy
    var playback
    var getTimePositionStub
    var clock

    function setFakeTimers () {
        clock = sinon.useFakeTimers()
        syncedProgressTimer._progressTimer = new ProgressTimer({
            callback: $.proxy(syncedProgressTimer.timerCallback, syncedProgressTimer),
            disableRequestAnimationFrame: true  // No window available during testing - use fallback mechanism to schedule updates
        })
    }

    function restoreFakeTimers () {
        clock.restore()
    }

    before(function () {
        $(document.body).append(
            '<div id="slidercontainer"><!-- slider for track position -->' +
                '<span id="songelapsed"></span>' +
                '<span id="songlength"></span>' +
                '<label for="trackslider" disabled="disabled">Position</label>' +
                '<input id="trackslider" name="trackslider"/>' +
            '</div>'
        )
        $('#trackslider').slider()  // Initialize slider
        $('#trackslider').on('slidestart', function () {
            syncedProgressTimer.stop()
            $('#trackslider').on('change', function () { syncedProgressTimer.updatePosition($(this).val()) })
        })

        $('#trackslider').on('slidestop', function () {
            $('#trackslider').off('change')
            syncedProgressTimer.updatePosition($(this).val())
            // Simulate doSeekPos($(this).val())
            syncedProgressTimer.set($(this).val())
        })

        playback = {
            getTimePosition: function () { return $.when(1000) },
            getState: function () { return $.when('stopped') }
        }
        getTimePositionStub = sinon.stub(playback, 'getTimePosition')
        // Simulate Mopidy's track position advancing 250ms between each call for 0:01 to 0:10
        for (var i = 0; i < 10000 / 250; i++) {
            getTimePositionStub.onCall(i).returns($.when((i + 1) * 250))
        }
        mopidy = sinon.stub(new Mopidy({callingConvention: 'by-position-or-by-name'}))
        mopidy.playback = playback
    })

    beforeEach(function () {
        syncedProgressTimer = new SyncedProgressTimer(MAX_ATTEMPTS, mopidy)
        syncedProgressTimer._isConnected = true
    })

    afterEach(function () {
        getTimePositionStub.reset()
    })

    describe('#SyncedTimer()', function () {
        it('should add text nodes to DOM for position and duration indicators', function () {
            expect($('#songelapsed')).to.have.text('')
            expect($('#songlength')).to.have.text('')
        })

        it('should start out in unsynced state', function () {
            assert.equal(syncedProgressTimer.syncState, SyncedProgressTimer.SYNC_STATE.NOT_SYNCED)
        })
    })

    describe('#format()', function () {
        it('should set value of text node', function () {
            assert.equal(SyncedProgressTimer.format(1000), '0:01')
        })

        it('should handle Infinity', function () {
            assert.equal(SyncedProgressTimer.format(Infinity), '')
        })

        it('should handle zero', function () {
            assert.equal(SyncedProgressTimer.format(0), '0:00')
        })
    })

    describe('#timerCallback()', function () {
        beforeEach(function () {
            setFakeTimers()
        })
        afterEach(function () {
            restoreFakeTimers()
        })

        it('should not try to sync unless connected to mopidy', function () {
            var _doSyncStub = sinon.stub(syncedProgressTimer, '_doSync')

            syncedProgressTimer._isConnected = false
            syncedProgressTimer.set(0, 1000).start()
            clock.tick(1000)

            assert.isFalse(_doSyncStub.called, '_doSync called')
            syncedProgressTimer.stop()
            _doSyncStub.restore()
        })

        it('should update text nodes', function () {
            var updateStub = sinon.stub(syncedProgressTimer, '_update')

            syncedProgressTimer.set(0, 1000).start()
            assert.isTrue(updateStub.called, '_update not called')
            syncedProgressTimer.stop()
            updateStub.restore()
        })

        it('should attempt to perform a sync as soon as timer is started', function () {
            var syncStub = sinon.stub(syncedProgressTimer, '_doSync')

            syncedProgressTimer.set(0, 1000).start() // 'start' will immediately schedule a sync.
            clock.tick(250)

            assert.isTrue(syncStub.called, '_doSync not called')
            syncedProgressTimer.stop()
            syncStub.restore()
        })

        it('should not attempt to perform a sync untill scheduled', function () {
            var syncStub = sinon.stub(syncedProgressTimer, '_doSync')

            syncedProgressTimer.set(0, 5000).start()
            syncedProgressTimer._scheduleSync(500)
            clock.tick(250)
            assert.isFalse(syncStub.called, 'next _doSync should only have been called after 500ms')

            syncStub.reset()
            clock.tick(500)
            assert.isTrue(syncStub.called, 'next _doSync not called after 500ms')
            syncedProgressTimer.stop()
            syncStub.restore()
        })

        it('should perform sync', function () {
            // Simulate runtime on a 5-second track
            assert.equal(syncedProgressTimer.syncState, SyncedProgressTimer.SYNC_STATE.NOT_SYNCED, 'Timer was initialized in incorrect state')
            syncedProgressTimer.set(0, 5000).start()

            var wasSyncing = false
            for (var i = 0; i < 4; i++) {
                clock.tick(250)
                wasSyncing = wasSyncing || syncedProgressTimer.syncState === SyncedProgressTimer.SYNC_STATE.SYNCING
            }
            syncedProgressTimer.stop()
            assert.isTrue(wasSyncing, 'Timer never entered the "syncing" state')
            assert.equal(syncedProgressTimer.syncState, SyncedProgressTimer.SYNC_STATE.SYNCED, 'Timer failed to sync')
            syncedProgressTimer.stop()
        })
    })

    describe('#_update()', function () {
        it('should set duration to "" for tracks with infinite duration (e.g. streams)', function () {
            syncedProgressTimer._update(1000, Infinity)
            assert.equal(syncedProgressTimer.durationNode.nodeValue, '')
        })

        it('should show "(wait)" while untill syncing starts', function () {
            syncedProgressTimer.syncState = SyncedProgressTimer.SYNC_STATE.NOT_SYNCED
            syncedProgressTimer._update(1000, 2000)
            assert.equal(syncedProgressTimer.positionNode.nodeValue, '(wait)')
        })

        it('should show "(sync)" while trying to sync up with Mopidy', function () {
            syncedProgressTimer.syncState = SyncedProgressTimer.SYNC_STATE.SYNCING
            syncedProgressTimer._update(1000, 2000)
            assert.equal(syncedProgressTimer.positionNode.nodeValue, '(sync)')
        })

        it('should update position text and position track slider when synced', function () {
            syncedProgressTimer.syncState = SyncedProgressTimer.SYNC_STATE.SYNCED
            syncedProgressTimer._update(1000, 2000)
            assert.equal(syncedProgressTimer.positionNode.nodeValue, '0:01')
            assert.equal($('#trackslider').val(), 1000)
        })
    })

    describe('#scheduleSync', function () {
        beforeEach(function () {
            setFakeTimers()
        })
        afterEach(function () {
            restoreFakeTimers()
        })

        it('should schedule sync when scheduled time arrives', function () {
            clock.tick(0)
            syncedProgressTimer._scheduleSync(1000)
            assert.isFalse(syncedProgressTimer._isSyncScheduled)
            clock.tick(1001)
            assert.isTrue(syncedProgressTimer._isSyncScheduled)
        })

        it('should clear schedule on each call', function () {
            var clearSpy = sinon.spy(window, 'clearTimeout')

            clock.tick(0)
            syncedProgressTimer._isSyncScheduled = true
            syncedProgressTimer._scheduleSync(1000)
            assert.isFalse(syncedProgressTimer._isSyncScheduled)

            var scheduleID = syncedProgressTimer._scheduleID
            clock.tick(1001)
            syncedProgressTimer._scheduleSync(1000)
            assert(clearSpy.calledWith(scheduleID))
            window.clearTimeout.restore()
        })
    })

    describe('#_doSync', function () {
        beforeEach(function () {
            setFakeTimers()
        })
        afterEach(function () {
            restoreFakeTimers()
        })

        it('should not try to sync until timer has been set', function () {
            syncedProgressTimer._doSync(0, Infinity)
            assert.isFalse(getTimePositionStub.called, 'tried to do sync even though the timer has not been set')
        })

        it('should request position from Mopidy', function () {
            syncedProgressTimer._doSync(1000, 2000)
            assert.isTrue(getTimePositionStub.called, 'getTimePosition not called')
        })

        it('should set state to "SYNCING" as soon as the first sync attempt is made', function () {
            syncedProgressTimer.syncState = SyncedProgressTimer.SYNC_STATE.NOT_SYNCED
            syncedProgressTimer._doSync(100, 2000)
            assert.equal(syncedProgressTimer.syncState, SyncedProgressTimer.SYNC_STATE.SYNCING)
        })

        it('should set state to synced after two consecutive successful syncs (i.e. time drift < 500ms)', function () {
            assert.equal(syncedProgressTimer.syncState, SyncedProgressTimer.SYNC_STATE.NOT_SYNCED)
            clock.tick(250)
            syncedProgressTimer._doSync(250, 2000)
            assert.equal(syncedProgressTimer.syncState, SyncedProgressTimer.SYNC_STATE.SYNCING)
            clock.tick(250)
            syncedProgressTimer._doSync(500, 2000)
            assert.equal(syncedProgressTimer.syncState, SyncedProgressTimer.SYNC_STATE.SYNCED)
        })

        it('should re-initialize and set state to syncing if time drift is more than 500ms', function () {
            var scheduleStub = sinon.stub(syncedProgressTimer, '_scheduleSync')

            syncedProgressTimer._doSync(1000, 2000)

            assert.equal(syncedProgressTimer.syncState, SyncedProgressTimer.SYNC_STATE.SYNCING)
            assert.equal(syncedProgressTimer._syncAttemptsRemaining, syncedProgressTimer._maxAttempts)
            assert.isNull(syncedProgressTimer._previousSyncPosition)
            assert(scheduleStub.calledWith(1000), 'Expected next sync to be scheduled 1s from now')
            scheduleStub.restore()
        })

        it('should step back exponentially while syncing', function () {
            var scheduleStub = sinon.stub(syncedProgressTimer, '_scheduleSync')

            for (var i = 0; i < syncedProgressTimer._maxAttempts; i++) {
                syncedProgressTimer._doSync(i * 250, 2000)
                assert.equal(syncedProgressTimer._syncAttemptsRemaining, syncedProgressTimer._maxAttempts - i - 1, 'Incorrect number of sync attempts remaining')
                assert(scheduleStub.calledWith(0.25 * (Math.pow(2, i)) * 1000), 'Incorrect sync time scheduled: ' + scheduleStub.getCall(i))
                scheduleStub.reset()
            }
            scheduleStub.restore()
        })

        it('should check sync every 32s once synced', function () {
            var scheduleStub = sinon.stub(syncedProgressTimer, '_scheduleSync')

            syncedProgressTimer._syncAttemptsRemaining = 0
            syncedProgressTimer._doSync(250, 2000)
            assert(scheduleStub.calledWith(32000))
            scheduleStub.restore()
        })

        it('should not sync unless track playback is progressing', function () {
            getTimePositionStub.restore()

            assert.equal(syncedProgressTimer.syncState, SyncedProgressTimer.SYNC_STATE.NOT_SYNCED)
            clock.tick(250)
            syncedProgressTimer._doSync(250, 2000)
            assert.equal(syncedProgressTimer.syncState, SyncedProgressTimer.SYNC_STATE.SYNCING)
            clock.tick(250)
            syncedProgressTimer._doSync(250, 2000)
            assert.equal(syncedProgressTimer.syncState, SyncedProgressTimer.SYNC_STATE.SYNCING)

            // Restore getTimePositionStub to previous state
            getTimePositionStub = sinon.stub(playback, 'getTimePosition')
            // Simulate Mopidy's track position advancing 250ms between each call for 0:01 to 0:10
            for (var i = 0; i < 10000 / 250; i++) {
                getTimePositionStub.onCall(i).returns($.when((i + 1) * 250))
            }
        })
    })

    describe('#set()', function () {
        it('should throw exception if no arguments are provided', function () {
            assert.throw(function () { syncedProgressTimer.set() }, Error)
        })

        it('should set position if only one argument is provided', function () {
            syncedProgressTimer.set(1000)
            assert.equal(syncedProgressTimer._progressTimer._state.position, 1000)
        })

        it('should update position and track slider immediately', function () {
            syncedProgressTimer.stop()
            syncedProgressTimer.set(1000, 2000)

            expect($('#songelapsed').text()).to.equal('0:01')
            assert.equal($('#trackslider').val(), 1000)
        })
    })

    describe('#start()', function () {
        it('should start timer', function () {
            var startStub = sinon.stub(syncedProgressTimer._progressTimer, 'start')
            syncedProgressTimer.start()
            assert(startStub.called)
            syncedProgressTimer.stop()
            startStub.restore()
        })

        it('should always start in unsynced state', function () {
            syncedProgressTimer.syncState = SyncedProgressTimer.SYNC_STATE.SYNCED
            syncedProgressTimer.start()
            assert.equal(syncedProgressTimer.syncState, SyncedProgressTimer.SYNC_STATE.NOT_SYNCED)
            syncedProgressTimer.stop()
        })

        it('should schedule a sync immediately', function () {
            var scheduleSpy = sinon.spy(syncedProgressTimer, '_scheduleSync')

            syncedProgressTimer.set(0, 1000)
            syncedProgressTimer._isSyncScheduled = false
            syncedProgressTimer.start()

            assert(scheduleSpy.calledWith(0))
            syncedProgressTimer.stop()
            syncedProgressTimer._scheduleSync.restore()
        })
    })

    describe('#stop()', function () {
        it('should stop timer', function () {
            var stopStub = sinon.stub(syncedProgressTimer._progressTimer, 'stop')
            syncedProgressTimer.stop()

            assert(stopStub.called)
            syncedProgressTimer.stop()
            stopStub.restore()
        })

        it('should show last synced position if stopped while busy syncing', function () {
            syncedProgressTimer.set(1000, 5000)
            syncedProgressTimer.syncState = SyncedProgressTimer.SYNC_STATE.SYNCED
            syncedProgressTimer._previousSyncPosition = 1000
            syncedProgressTimer.syncState = SyncedProgressTimer.SYNC_STATE.SYNCING
            syncedProgressTimer._update(2000, 5000)
            assert.equal(syncedProgressTimer.positionNode.nodeValue, '(sync)')
            syncedProgressTimer.stop()
            assert.equal(syncedProgressTimer.positionNode.nodeValue, '0:01')
            expect($('#songelapsed').text()).to.equal('0:01')
        })

        it('should cancel any scheduled syncs', function () {
            var cancelSpy = sinon.spy(window, 'clearTimeout')

            syncedProgressTimer._isSyncScheduled = true
            syncedProgressTimer.stop()

            assert.isFalse(syncedProgressTimer._isSyncScheduled)
            assert(cancelSpy.calledWith(syncedProgressTimer._scheduleID))
            window.clearTimeout.restore()
        })
    })

    describe('#reset()', function () {
        it('should reset timer to "" - "" ', function () {
            var stopStub = sinon.stub(syncedProgressTimer, 'stop')
            var setStub = sinon.stub(syncedProgressTimer, 'set')

            syncedProgressTimer.reset()

            assert(stopStub.called)
            assert(setStub.called)

            assert.equal(syncedProgressTimer.positionNode.nodeValue, '', 'Position node was not reset')
            assert.equal(syncedProgressTimer.durationNode.nodeValue, '', 'Duration node was not reset')

            stopStub.restore()
            setStub.restore()
        })
    })

    describe('#updatePosition()', function () {
        it('should format and set position node', function () {
            var formatSpy = sinon.spy(SyncedProgressTimer, 'format')
            assert.equal(syncedProgressTimer.positionNode.nodeValue, '')
            syncedProgressTimer.updatePosition(1000)

            assert.isTrue(formatSpy.called)
            expect(syncedProgressTimer.positionNode.nodeValue).to.equal('0:01')
            SyncedProgressTimer.format.restore()
        })

        it('should set position to "" if timer has not been initialized', function () {
            syncedProgressTimer.set(1000, 2000)
            expect(syncedProgressTimer.positionNode.nodeValue).to.equal('0:01')

            syncedProgressTimer.updatePosition(0)
            assert.equal(syncedProgressTimer.positionNode.nodeValue, '0:00', 'Position node was not reset')

            syncedProgressTimer.reset()
            syncedProgressTimer.updatePosition(0)
            assert.equal(syncedProgressTimer.positionNode.nodeValue, '', 'Position node was not reset')
        })
    })

    describe('integration tests', function () {
        beforeEach(function () {
            setFakeTimers()
        })
        afterEach(function () {
            restoreFakeTimers()
        })

        it('simulate 30-second test run, ', function () {
            // Initialize
            syncedProgressTimer.reset()
            expect($('#songelapsed').text()).to.equal('')
            expect($('#songlength').text()).to.equal('')
            assert.equal($('#trackslider').val(), 0)

            // Set song info
            syncedProgressTimer.set(0, 30000)
            expect($('#songelapsed').text()).to.equal('0:00')
            expect($('#songlength').text()).to.equal('0:30')
            assert.equal($('#trackslider').val(), 0)

            // Start
            syncedProgressTimer.start()
            clock.tick(40)
            expect($('#songelapsed').text()).to.equal('(wait)')
            expect($('#songlength').text()).to.equal('0:30')
            assert.equal($('#trackslider').val(), 0)

            // Syncing
            clock.tick(250)
            expect($('#songelapsed').text()).to.equal('(sync)')
            expect($('#songlength').text()).to.equal('0:30')
            assert.equal($('#trackslider').val(), 0)

            // Synced
            clock.tick(1000)
            expect($('#songelapsed').text()).to.equal('0:01')
            expect($('#songlength').text()).to.equal('0:30')
            assert.isAtLeast($('#trackslider').val(), 1000)

            // Move slider
            $('#trackslider').trigger('slidestart')
            clock.tick(250)
            $('#trackslider').val(5000).slider('refresh')
            $('#trackslider').trigger('change')
            clock.tick(250)
            $('#trackslider').trigger('slidestop')

            clock.tick(1000) // Position should remain '0:05' as the timer should not be running after a slider change
            expect($('#songelapsed').text()).to.equal('0:05')

            // Start -> Sync -> Stop
            syncedProgressTimer.start()
            clock.tick(40)
            expect($('#songelapsed').text()).to.equal('(sync)')
            syncedProgressTimer._previousSyncPosition = 1000
            syncedProgressTimer.stop()
            expect($('#songelapsed').text()).to.equal('0:01')
            expect($('#songlength').text()).to.equal('0:30')

            syncedProgressTimer.stop()
        })
    })

    describe('regression tests for https://github.com/adamcik/media-progress-timer/issues/3', function () {
        it('should not be possible to set position > duration', function () {
            syncedProgressTimer.set(1000, 2000).start()

            assert.equal(syncedProgressTimer._duration, 2000)
            syncedProgressTimer.set(3000)
            assert.equal(syncedProgressTimer._progressTimer._state.position, 1999, 'Expected position to be less than duration')
            syncedProgressTimer.stop()
        })

        it('should keep timer running even if an update would cause position > duration', function () {
            setFakeTimers()

            clock.tick(0)
            clock.tick(1000)
            syncedProgressTimer.set(0, 1000).start()
            clock.tick(2000)

            assert.isNotNull(syncedProgressTimer._progressTimer._updateId)
            syncedProgressTimer.stop()

            restoreFakeTimers()
        })
    })
})
