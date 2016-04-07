(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory)
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory()
    } else {
        root.SyncedProgressTimer = factory()
    }
}(this, function () {
    'use strict'

    function delay_exponential (base, growthFactor, attempts) {
        /* Calculate number of beats between syncs based on exponential function.
        The format is::

            base * growthFactor ^ (attempts - 1)

        If ``base`` is set to 'rand' then a random number between
        0 and 1 will be used as the base.
        Base must be greater than 0.
        */
        if (base === 'rand') {
            base = Math.random()
        }
        // console.log(base + ' * (Math.pow(' + growthFactor + ', (' + attempts + ' - 1)) = ' + base * (Math.pow(growthFactor, (attempts - 1))))
        return base * (Math.pow(growthFactor, (attempts - 1)))
    }

    function SyncedProgressTimer (maxAttempts, mopidy) {
        if (!(this instanceof SyncedProgressTimer)) {
            return new SyncedProgressTimer(maxAttempts, mopidy)
        }

        this.positionNode = document.createTextNode('')
        this.durationNode = document.createTextNode('')

        $('#songelapsed').empty().append(this.positionNode)
        $('#songlength').empty().append(this.durationNode)

        this._progressTimer = new ProgressTimer({
            // Make sure that the timer object's context is available.
            callback: $.proxy(this.timerCallback, this)
        })

        this._maxAttempts = maxAttempts
        this._mopidy = mopidy
        this._isConnected = false
        this._mopidy.on('state:online', $.proxy(function () { this._isConnected = true }), this)
        this._mopidy.on('state:offline', $.proxy(function () { this._isConnected = false }), this)
        this.syncState = SyncedProgressTimer.SYNC_STATE.NOT_SYNCED
        this._isSyncScheduled = false
        this._scheduleID = null
        this._syncAttemptsRemaining = this._maxAttempts
        this._previousSyncPosition = null
        this._duration = null
    }

    SyncedProgressTimer.SYNC_STATE = {
        NOT_SYNCED: 0,
        SYNCING: 1,
        SYNCED: 2
    }

    SyncedProgressTimer.format = function (milliseconds) {
        if (milliseconds === Infinity) {
            return ''
        } else if (milliseconds === 0) {
            return '0:00'
        }

        var seconds = Math.floor(milliseconds / 1000)
        var minutes = Math.floor(seconds / 60)
        seconds = seconds % 60

        seconds = seconds < 10 ? '0' + seconds : seconds
        return minutes + ':' + seconds
    }

    SyncedProgressTimer.prototype.timerCallback = function (position, duration) {
        this._update(position, duration)
        if (this._isSyncScheduled && this._isConnected) {
            this._doSync(position, duration)
        }
    }

    SyncedProgressTimer.prototype._update = function (position, duration) {
        switch (this.syncState) {
            case SyncedProgressTimer.SYNC_STATE.NOT_SYNCED:
                // Waiting for Mopidy to provide a target position.
                this.positionNode.nodeValue = '(wait)'
                break
            case SyncedProgressTimer.SYNC_STATE.SYNCING:
                // Busy seeking to new target position.
                this.positionNode.nodeValue = '(sync)'
                break
            case SyncedProgressTimer.SYNC_STATE.SYNCED:
                this._previousSyncPosition = position
                this.positionNode.nodeValue = SyncedProgressTimer.format(position)
                $('#trackslider').val(position).slider('refresh')
                break
        }
    }

    SyncedProgressTimer.prototype._scheduleSync = function (milliseconds) {
        // Use an anonymous callback to set a boolean value, which should be faster to
        // check in the timeout callback than doing another function call.
        clearTimeout(this._scheduleID)
        this._isSyncScheduled = false
        this._scheduleID = setTimeout($.proxy(function () { this._isSyncScheduled = true }, this), milliseconds)
    }

    SyncedProgressTimer.prototype._doSync = function (position, duration) {
        var ready = !(duration === Infinity && position === 0)  // Timer has been properly initialized.
        if (!ready) {
            // Don't try to sync if progress timer has not been initialized yet.
            return
        }

        var _this = this
        _this._mopidy.playback.getTimePosition().then(function (targetPosition) {
            if (_this.syncState === SyncedProgressTimer.SYNC_STATE.NOT_SYNCED) {
                _this.syncState = SyncedProgressTimer.SYNC_STATE.SYNCING
            }
            if (Math.abs(targetPosition - position) <= 500) {
                // Less than 500ms == in sync.
                _this._syncAttemptsRemaining = Math.max(_this._syncAttemptsRemaining - 1, 0)
                if (_this._syncAttemptsRemaining < _this._maxAttempts - 1 && _this._previousSyncPosition !== targetPosition) {
                    // Need at least two consecutive syncs to know that Mopidy
                    // is progressing playback and we are in sync.
                    _this.syncState = SyncedProgressTimer.SYNC_STATE.SYNCED
                }
                _this._previousSyncPosition = targetPosition
                // Step back exponentially while increasing number of callbacks.
                _this._scheduleSync(delay_exponential(0.25, 2, _this._maxAttempts - _this._syncAttemptsRemaining) * 1000)
            } else {
                // Drift is too large, re-sync with Mopidy.
                _this.syncState = SyncedProgressTimer.SYNC_STATE.SYNCING
                _this._syncAttemptsRemaining = _this._maxAttempts
                _this._previousSyncPosition = null
                _this._scheduleSync(1000)
                _this._progressTimer.set(targetPosition)
            }
        })
    }

    SyncedProgressTimer.prototype.set = function (position, duration) {
        if (arguments.length === 0) {
            throw new Error('"SyncedProgressTimer.set" requires the "position" argument.')
        }

        this.syncState = SyncedProgressTimer.SYNC_STATE.NOT_SYNCED
        this._syncAttemptsRemaining = this._maxAttempts
        // Workaround for https://github.com/adamcik/media-progress-timer/issues/3
        // This causes the timer to die unexpectedly if the position exceeds
        // the duration slightly.
        if (this._duration && this._duration < position) {
            position = this._duration - 1
        }
        if (arguments.length === 1) {
            this._progressTimer.set(position)
        } else {
            this._duration = duration
            this._progressTimer.set(position, duration)
            this.durationNode.nodeValue = SyncedProgressTimer.format(duration)
        }

        this.updatePosition(position, duration)
        $('#trackslider').val(position).slider('refresh')

        return this
    }

    SyncedProgressTimer.prototype.start = function () {
        this.syncState = SyncedProgressTimer.SYNC_STATE.NOT_SYNCED
        this._scheduleSync(0)
        this._progressTimer.start()
        return this
    }

    SyncedProgressTimer.prototype.stop = function () {
        this._progressTimer.stop()
        clearTimeout(this._scheduleID)
        this._isSyncScheduled = false
        if (this.syncState !== SyncedProgressTimer.SYNC_STATE.SYNCED && this._previousSyncPosition) {
            // Timer was busy trying to sync when it was stopped, fallback to displaying the last synced position on screen.
            this.positionNode.nodeValue = SyncedProgressTimer.format(this._previousSyncPosition)
        }
        return this
    }

    SyncedProgressTimer.prototype.reset = function () {
        this.stop()
        this.set(0, Infinity)

        return this
    }

    SyncedProgressTimer.prototype.updatePosition = function (position) {
        if (!(this._duration === Infinity && position === 0)) {
            this.positionNode.nodeValue = SyncedProgressTimer.format(position)
        } else {
            this.positionNode.nodeValue = ''
        }
    }

    return SyncedProgressTimer
}))
