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

        $('#songelapsed').append(this.positionNode)
        $('#songlength').append(this.durationNode)

        this._progressTimer = new ProgressTimer({
            // Make sure that the timer object's context is available.
            callback: $.proxy(this.timerCallback, this)
        })

        this._maxAttempts = maxAttempts
        this._mopidy = mopidy
        this._isConnected = false
        this._mopidy.on('state:online', $.proxy(function () { this._isConnected = true }), this)
        this._mopidy.on('state:offline', $.proxy(function () { this._isConnected = false }), this)
        this.init()
    }

    SyncedProgressTimer.SYNC_STATE = {
        NOT_SYNCED: 0,
        SYNCING: 1,
        SYNCED: 2
    }

    SyncedProgressTimer.format = function (milliseconds) {
        if (milliseconds === Infinity) {
            return '(n/a)'
        } else if (milliseconds === 0) {
            return '0:00'
        }

        var seconds = Math.floor(milliseconds / 1000)
        var minutes = Math.floor(seconds / 60)
        seconds = seconds % 60

        seconds = seconds < 10 ? '0' + seconds : seconds
        return minutes + ':' + seconds
    }

    SyncedProgressTimer.prototype.init = function () {
        this.syncState = SyncedProgressTimer.SYNC_STATE.NOT_SYNCED
        this._syncAttemptsRemaining = this._maxAttempts

        this.positionNode.nodeValue = ''
        this.durationNode.nodeValue = ''

        this._scheduledSyncTime = null
        this._previousSyncPosition = null
        this._duration = null

        return this
    }

    SyncedProgressTimer.prototype.timerCallback = function (position, duration) {
        this._update(position, duration)

        if (this._isConnected && this._isSyncScheduled()) {
            this._doSync(position, duration)
        }
    }

    SyncedProgressTimer.prototype._update = function (position, duration) {
        if (!(duration === Infinity && position === 0)) {
            // Timer has been properly initialized.
            this.durationNode.nodeValue = SyncedProgressTimer.format(duration || Infinity)
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
        } else {
            // Make sure that default values are displayed while the timer is being initialized.
            this.positionNode.nodeValue = ''
            this.durationNode.nodeValue = ''
            $('#trackslider').val(0).slider('refresh')
        }
    }

    SyncedProgressTimer.prototype._isSyncScheduled = function () {
        return this._scheduledSyncTime !== null && this._scheduledSyncTime <= new Date().getTime()
    }

    SyncedProgressTimer.prototype._doSync = function (position, duration) {
        var ready = !(duration === Infinity && position === 0)  // Timer has been properly initialized.
        if (!ready) {
            // Don't try to sync if progress timer has not been initialized yet.
            return
        }
        var _this = this
        _this._mopidy.playback.getTimePosition().then(function (targetPosition) {
            if (Math.abs(targetPosition - position) <= 500) {
                // Less than 500ms == in sync.
                _this.syncState = SyncedProgressTimer.SYNC_STATE.SYNCING
                _this._syncAttemptsRemaining = Math.max(_this._syncAttemptsRemaining - 1, 0)
                if (_this._syncAttemptsRemaining < _this._maxAttempts - 1 && _this._previousSyncPosition !== targetPosition) {
                    // Need at least two consecutive syncs to know that Mopidy
                    // is progressing playback and we are in sync.
                    _this.syncState = SyncedProgressTimer.SYNC_STATE.SYNCED
                }
                _this._previousSyncPosition = targetPosition
                // Step back exponentially while increasing number of callbacks.
                _this._scheduledSyncTime = new Date().getTime() +
                    delay_exponential(0.25, 2, _this._maxAttempts - _this._syncAttemptsRemaining) * 1000
            } else {
                // Drift is too large, re-sync with Mopidy.
                _this._syncAttemptsRemaining = _this._maxAttempts
                _this._scheduledSyncTime = new Date().getTime() + 100
                _this._previousSyncPosition = null
                _this.syncState = SyncedProgressTimer.SYNC_STATE.SYNCING
                _this._progressTimer.set(targetPosition)
            }
        })
    }

    SyncedProgressTimer.prototype.set = function (position, duration) {
        if (arguments.length === 0) {
            throw new Error('"SyncedProgressTimer.set" requires the "position" argument.')
        }
        // Workaround for https://github.com/adamcik/media-progress-timer/issues/3
        // This causes the timer to die unexpectedly if the position exceeds
        // the duration slightly.
        if (this._duration && this._duration < position) {
            position = this._duration - 1
        }
        this.init()
        if (arguments.length === 1) {
            this._progressTimer.set(position)
        } else {
            this._duration = duration
            this._progressTimer.set(position, duration)
        }

        if (!this._isSyncScheduled()) {
            // Set lapsed time and slider position directly as timer callback is not currently
            // running.
            this.positionNode.nodeValue = SyncedProgressTimer.format(position)
            if (arguments.length === 2) {
                this.durationNode.nodeValue = SyncedProgressTimer.format(duration)
            }
            $('#trackslider').val(position).slider('refresh')
        }

        return this
    }

    SyncedProgressTimer.prototype.start = function () {
        this.syncState = SyncedProgressTimer.SYNC_STATE.NOT_SYNCED
        this._scheduledSyncTime = new Date().getTime()
        this._progressTimer.start()
        return this
    }

    SyncedProgressTimer.prototype.stop = function () {
        this._progressTimer.stop()
        this._scheduledSyncTime = null
        this.updatePosition(this._previousSyncPosition)
        return this
    }

    SyncedProgressTimer.prototype.reset = function () {
        this._progressTimer.reset()
        this.stop()
        this.init()
        this.set(0, Infinity)

        return this
    }

    SyncedProgressTimer.prototype.updatePosition = function (position) {
        this.positionNode.nodeValue = SyncedProgressTimer.format(position)
    }

    return SyncedProgressTimer
}))
