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
    })
    beforeEach(function () {
        playback = {
            getTimePosition: function () { return $.when(1000) },
            getState: function () { return $.when('stopped') }
        }
        mopidy = new Mopidy({callingConvention: 'by-position-or-by-name'})
        mopidy.playback = playback
        getTimePositionStub = sinon.stub(playback, 'getTimePosition')
        // Simulate Mopidy's track position advancing 10ms between each call.
        for (var i = 0; i < MAX_ATTEMPTS; i++) {
            getTimePositionStub.onCall(i).returns($.when(1000 + i * 10))
        }
        mopidy = sinon.stub(mopidy)
        syncedProgressTimer = new SyncedProgressTimer(MAX_ATTEMPTS, mopidy)
        syncedProgressTimer._isConnected = true
    })
    afterEach(function () {
        getTimePositionStub.restore()
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
            assert.equal(SyncedProgressTimer.format(Infinity), '(n/a)')
        })

        it('should handle zero', function () {
            assert.equal(SyncedProgressTimer.format(0), '0:00')
        })
    })

    describe('#timerCallback()', function () {
        var clock
        beforeEach(function () {
            clock = sinon.useFakeTimers()
            syncedProgressTimer._progressTimer = new ProgressTimer({
                callback: $.proxy(syncedProgressTimer.timerCallback, syncedProgressTimer),
                disableRequestAnimationFrame: true  // No window available during testing - use fallback mechanism to schedule updates
            })
        })
        afterEach(function () {
            clock.restore()
        })

        it('should not try to sync unless connected to mopidy', function () {
            syncedProgressTimer._isConnected = false
            var _syncScheduledStub = sinon.stub(syncedProgressTimer, '_isSyncScheduled')
            assert.isFalse(_syncScheduledStub.called, '_syncScheduledStub called')
            _syncScheduledStub.restore()
        })

        it('should update text nodes', function () {
            var updateStub = sinon.stub(syncedProgressTimer, '_update')
            syncedProgressTimer.set(0, 1000).start()
            assert.isTrue(updateStub.called, '_update not called')
            updateStub.restore()
        })

        it('should check if a sync is scheduled', function () {
            var scheduleStub = sinon.stub(syncedProgressTimer, '_isSyncScheduled').returns(true)
            syncedProgressTimer.set(0, 1000).start()
            assert.isTrue(scheduleStub.called, '_isSyncScheduled not called')
            scheduleStub.restore()
        })

        it('should attempt to perform a sync when scheduled', function () {
            var syncStub = sinon.stub(syncedProgressTimer, '_doSync')
            syncedProgressTimer.set(0, 1000).start()
            clock.tick(250)
            assert.isTrue(syncStub.called, '_doSync not called')
            syncStub.restore()
        })

        it('should perform sync', function () {
            // Simulate runtime on a 5-second track
            assert.equal(syncedProgressTimer.syncState, SyncedProgressTimer.SYNC_STATE.NOT_SYNCED, 'Timer was initialized in incorrect state')
            syncedProgressTimer.set(0, 5000).start()
            var wasSyncing = false
            for (var i = 0; i < MAX_ATTEMPTS; i++) {
                clock.tick(250)  // 250ms * MAX_ATTEMPTS is only 2 seconds, but we'll be synced after only two attempts
                wasSyncing = wasSyncing || syncedProgressTimer.syncState === SyncedProgressTimer.SYNC_STATE.SYNCING
            }
            assert.isTrue(wasSyncing, 'Timer never entered the "syncing" state')
            assert.equal(syncedProgressTimer.syncState, SyncedProgressTimer.SYNC_STATE.SYNCED, 'Timer failed to sync')
        })
    })

    describe('#_update()', function () {
        it('should clear timers and reset slider to zero while not ready', function () {
            syncedProgressTimer.positionNode.nodeValue = '1:00'
            syncedProgressTimer.durationNode.nodeValue = '2:00'
            $('#trackslider').val(100).slider('refresh')
            syncedProgressTimer._update(0, Infinity)

            assert.equal(syncedProgressTimer.positionNode.nodeValue, '')
            assert.equal(syncedProgressTimer.durationNode.nodeValue, '')
            assert.equal($('#trackslider').val(), 0)
        })

        it('should set duration to "(n/a)" for tracks with infinite duration (e.g. streams)', function () {
            syncedProgressTimer._update(1000, Infinity)
            assert.equal(syncedProgressTimer.durationNode.nodeValue, '(n/a)')
        })

        it('should show "(wait)" while waiting for Mopidy to supply a position', function () {
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

    describe('#_isSyncScheduled()', function () {
        var scheduleSpy
        var clock
        before(function () {
            scheduleSpy = sinon.spy(syncedProgressTimer, '_isSyncScheduled')
            clock = sinon.useFakeTimers()
        })
        after(function () {
            scheduleSpy.restore()
            clock.restore()
        })
        it('should schedule sync when scheduled time arrives', function () {
            syncedProgressTimer._scheduledSyncTime = new Date().getTime() + 1000
            assert.isFalse(syncedProgressTimer._isSyncScheduled())
            clock.tick(1000)
            assert.isTrue(syncedProgressTimer._isSyncScheduled())
        })
    })

    describe('#_doSync', function () {
        var clock
        beforeEach(function () {
            clock = sinon.useFakeTimers()
        })
        afterEach(function () {
            clock.restore()
        })
        it('should not try to sync until timer has been set', function () {
            syncedProgressTimer._doSync(0, Infinity)
            assert.isFalse(getTimePositionStub.called, 'getTimePosition called even though timer has not been set')
        })
        it('should request position from Mopidy', function () {
            syncedProgressTimer._doSync(1000, 2000)
            assert.isTrue(getTimePositionStub.called, 'getTimePosition not called')
        })

        it('should set state to synced after two consecutive successful syncs (i.e. time drift < 500ms)', function () {
            assert.equal(syncedProgressTimer.syncState, SyncedProgressTimer.SYNC_STATE.NOT_SYNCED)
            clock.tick(10)
            syncedProgressTimer._doSync(1010, 2000)
            assert.equal(syncedProgressTimer.syncState, SyncedProgressTimer.SYNC_STATE.SYNCING)
            clock.tick(10)
            syncedProgressTimer._doSync(1020, 2000)
            assert.equal(syncedProgressTimer.syncState, SyncedProgressTimer.SYNC_STATE.SYNCED)
        })

        it('should re-initialize and set state to syncing if time drift is more than 500ms', function () {
            syncedProgressTimer._doSync(1, 2000)
            assert.equal(syncedProgressTimer.syncState, SyncedProgressTimer.SYNC_STATE.SYNCING)
            assert.equal(syncedProgressTimer._syncAttemptsRemaining, syncedProgressTimer._maxAttempts)
        })

        it('should step back exponentially while syncing', function () {
            for (var i = 0; i < syncedProgressTimer._maxAttempts; i++) {
                syncedProgressTimer._doSync(1000 + (i + 1) * 10, 2000)
                // If we don't advance the clock then '_syncAttemptsRemaining' should just contain the step-back in seconds
                assert.equal(syncedProgressTimer._syncAttemptsRemaining, syncedProgressTimer._maxAttempts - i - 1, 'Incorrect sync attempts remaining')
                assert.equal(syncedProgressTimer._scheduledSyncTime, (0.25 * (Math.pow(2, i)) * 1000), 'Incorrect sync time scheduled')
            }
        })

        it('should check sync every 32s once synced', function () {
            syncedProgressTimer._syncAttemptsRemaining = 0
            syncedProgressTimer._doSync(1000, 2000)
            assert.equal(syncedProgressTimer._scheduledSyncTime, 32000)
        })

        it('should not sync unless track playback is progressing', function () {
            getTimePositionStub.restore()
            getTimePositionStub = sinon.stub(playback, 'getTimePosition')
            getTimePositionStub.returns($.when(1000)) // Simulate playback 'stuck' at 1000ms.
            assert.equal(syncedProgressTimer.syncState, SyncedProgressTimer.SYNC_STATE.NOT_SYNCED)
            clock.tick(10)
            syncedProgressTimer._doSync(1010, 2000)
            assert.equal(syncedProgressTimer.syncState, SyncedProgressTimer.SYNC_STATE.SYNCING)
            clock.tick(10)
            syncedProgressTimer._doSync(1010, 2000)
            assert.equal(syncedProgressTimer.syncState, SyncedProgressTimer.SYNC_STATE.SYNCING)
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

        it('should update track slider if no sync is scheduled', function () {
            syncedProgressTimer.stop()
            syncedProgressTimer.set(1000, 2000)
            expect($('#songelapsed').text()).to.endWith('0:01')
            assert.equal($('#trackslider').val(), 1000)
        })

        it('should implement workaround for https://github.com/adamcik/media-progress-timer/issues/3', function () {
            syncedProgressTimer.set(1000, 2000).start()
            assert.equal(syncedProgressTimer._duration, 2000)
            syncedProgressTimer.set(3000)
            assert.equal(syncedProgressTimer._progressTimer._state.position, 1999)
        })
    })

    describe('#start()', function () {
        it('should start timer', function () {
            var startStub = sinon.stub(syncedProgressTimer._progressTimer, 'start')
            syncedProgressTimer.start()
            assert(startStub.called)
            startStub.restore()
        })

        it('should always start in unsynced state', function () {
            syncedProgressTimer.syncState = SyncedProgressTimer.SYNC_STATE.SYNCED
            syncedProgressTimer.start()
            assert.equal(syncedProgressTimer.syncState, SyncedProgressTimer.SYNC_STATE.NOT_SYNCED)
        })

        it('should schedule a sync immediately', function () {
            var clock = sinon.useFakeTimers()
            syncedProgressTimer._scheduledSyncTime = new Date().getTime() + 5000
            expect(syncedProgressTimer._scheduledSyncTime).to.be.above(new Date().getTime())
            syncedProgressTimer.start()
            clock.tick(1000)
            expect(syncedProgressTimer._scheduledSyncTime).to.be.below(new Date().getTime())
            clock.restore()
        })
    })

    describe('#stop()', function () {
        it('should stop timer', function () {
            var stopStub = sinon.stub(syncedProgressTimer._progressTimer, 'stop')
            syncedProgressTimer.stop()
            assert(stopStub.called)
            stopStub.restore()
        })

        it('should show position when stopped', function () {
            syncedProgressTimer.syncState = SyncedProgressTimer.SYNC_STATE.SYNCED
            syncedProgressTimer._update(1000, 5000)
            syncedProgressTimer.syncState = SyncedProgressTimer.SYNC_STATE.SYNCING
            syncedProgressTimer._update(2000, 5000)
            assert.equal(syncedProgressTimer.positionNode.nodeValue, '(sync)')
            syncedProgressTimer.stop()
            assert.equal(syncedProgressTimer.positionNode.nodeValue, '0:01')
        })

        it('should cancel any scheduled syncs', function () {
            syncedProgressTimer._scheduledSyncTime = 5000
            syncedProgressTimer.stop()
            expect(syncedProgressTimer._scheduledSyncTime).to.be.null
        })
    })

    describe('#reset()', function () {
        it('should reset timer to 0:00 - (n/a) ', function () {
            var resetStub = sinon.stub(syncedProgressTimer._progressTimer, 'reset')
            var initStub = sinon.stub(syncedProgressTimer, 'init')
            var stopStub = sinon.stub(syncedProgressTimer, 'stop')

            syncedProgressTimer.reset()

            assert(resetStub.called)
            assert(initStub.called)
            assert(stopStub.called)

            assert.equal(syncedProgressTimer.positionNode.nodeValue, '0:00')
            assert.equal(syncedProgressTimer.durationNode.nodeValue, '(n/a)')

            resetStub.restore()
            initStub.restore()
            stopStub.restore()
        })
    })

    describe('#updatePosition()', function () {
        it('should format and set position node', function () {
            var formatSpy = sinon.spy(SyncedProgressTimer, 'format')
            assert.equal(syncedProgressTimer.positionNode.nodeValue, '')
            syncedProgressTimer.updatePosition(1000)

            assert.isTrue(formatSpy.called)
            expect(syncedProgressTimer.positionNode.nodeValue).to.endWith('0:01')
            formatSpy.restore()
        })
    })
})
