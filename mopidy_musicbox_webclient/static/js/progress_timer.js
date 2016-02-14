var progressTimer;
var progressElement = document.getElementById('trackslider');
var positionNode = document.createTextNode('0:00');
var durationNode = document.createTextNode('0:00');

var START_BEATS = 5 // 0.5 seconds, needs to be less than 1s to prevent unwanted updates.
var RUN_BEATS = 300  // 30 seconds assuming default timer update rate of 100ms
var callbackHeartbeats = 0;  // Timer will check syncs on every n-number of calls.
var targetPosition = null;

var MAX_SYNCS = 5;  // Maximum number of consecutive successful syncs to perform.
var syncsLeft = MAX_SYNCS;
var synced = false;
var consecutiveSyncs = 0;

document.getElementById('songelapsed').appendChild(positionNode);
document.getElementById('songlength').appendChild(durationNode);

function timerCallback(position, duration, isRunning) {
    updateTimers(position, duration, isRunning);

    if (callbackHeartbeats == 0) {
        callbackHeartbeats = getHeartbeat();
    }

    if (mopidy && position > 0) {
        // Mopidy and timer are both initialized.
        if (callbackHeartbeats-- == 1) {
            // Get time position from Mopidy on every nth callback until
            // synced.
            mopidy.playback.getTimePosition().then(
                function(mopidy_position) {
                    syncTimer(position, mopidy_position);
                }
            );
        }
    }
}

function updateTimers(position, duration, isRunning) {
    var ready = !(duration == Infinity && position == 0 && !isRunning);  // Timer has been properly initialized.
    var streaming = (duration == Infinity && position > 0); // Playing a stream.
    var ok = synced && isRunning;  // Normal operation.
    var syncing = !synced && isRunning; // Busy syncing.

    if (!ready) {
        //Make sure that default values are displayed while the timer is being initialized.
        positionNode.nodeValue = '';
        durationNode.nodeValue = '';
        $("#trackslider").val(0).slider('refresh');
    } else if (syncing) {
        if (!targetPosition) {
            // Waiting for Mopidy to provide a target position.
            positionNode.nodeValue = '(wait)';
        } else {
            // Busy seeking to new target position.
            positionNode.nodeValue = '(sync)';
        }
    } else if (streaming) {
        positionNode.nodeValue = format(position);;
        durationNode.nodeValue = '(n/a)';
    } else if (synced) {
        positionNode.nodeValue = format(position);
        durationNode.nodeValue = format(duration || 0);
    }

    if (ok) {
        // Don't update the track slider unless it is synced and running.
        // (prevents awkward 'jitter' animation).
        $("#trackslider").val(position).slider('refresh');
    }
}

function getHeartbeat() {
    if (syncsLeft > 0 && callbackHeartbeats == 0) {
        // Step back exponentially while increasing heartbeat.
        return Math.round(delay_exponential(5, 2, MAX_SYNCS - syncsLeft));
    } else if (syncsLeft == 0 && callbackHeartbeats == 0) {
        // Sync completed, keep checking using maximum number of heartbeats.
        return RUN_BEATS;
    } else {
        return START_BEATS;
    }
}

function syncTimer(current, target) {
    if (target) {
        var drift = Math.abs(target - current);
        if (drift <= 500) {
            syncsLeft--;
            // Less than 500ms == in sync.
            if (++consecutiveSyncs == 2) {
                // Need at least two consecutive syncs to know that Mopidy
                // is progressing playback and we are in sync.
                synced = true;
                targetPosition = null;
                consecutiveSyncs = 0;
            }
        } else {
            // Drift is too large, re-sync with Mopidy.
            reset();
            targetPosition = target;
            progressTimer.set(targetPosition);
        }
    }
}

function toInt(value) {
    return value.match(/^\w*\d+\w*$/) ? parseInt(value) : null;
}

function format(milliseconds) {
    if (milliseconds === Infinity) {
        return '0:00';
    }

    var seconds = Math.floor(milliseconds / 1000);
    var minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;

    seconds = seconds < 10 ? '0' + seconds : seconds;
    return minutes + ':' + seconds;
}

function delay_exponential(base, growthFactor, attempts) {
    /*Calculate number of beats between syncs based on exponential function.
    The format is::

        base * growthFactor ^ (attempts - 1)

    If ``base`` is set to 'rand' then a random number between
    0 and 1 will be used as the base.
    Base must be greater than 0.
    */
    if (base == 'rand') {
        base = Math.random();
    }
    beats = base * (Math.pow(growthFactor, (attempts - 1)));
    return beats;
}

function reset() {
    synced = false;
    consecutiveSyncs = 0;
    syncsLeft = MAX_SYNCS;
    callbackHeartbeats = START_BEATS;
    targetPosition = null;
}

function setProgressTimer(pos) {
    reset();
    targetPosition = pos;
    progressTimer.set(pos);
    if (!play) {
        // Set lapsed time and slider position directly as timer callback is not currently
        // running.
        positionNode.nodeValue = format(pos);
        $("#trackslider").val(pos).slider('refresh');
    }
}

function startProgressTimer() {
    reset();
    progressTimer.start();
}

function resetProgressTimer() {
    progressTimer.reset();
    reset();
    targetPosition = 0;
}
