/*! timer.js v2.0.2
 * https://github.com/adamcik/media-progress-timer
 * Copyright (c) 2015 Thomas Adamcik
 * Licensed under the Apache License, Version 2.0 */

(function() {

'use strict';

var now = typeof window.performance !== 'undefined' &&
          typeof window.performance.now !== 'undefined' &&
          window.performance.now.bind(window.performance) || Date.now ||
          function() { return new Date().getTime(); };

function ProgressTimer(options) {
    if (!(this instanceof ProgressTimer)) {
        return new ProgressTimer(options);
    } else if (typeof options === 'function') {
        options = {'callback': options};
    } else if (typeof options !== 'object') {
        throw 'ProgressTimer must be called with a callback or options.';
    } else if (typeof options.callback !== 'function') {
        throw 'ProgressTimer needs a callback to operate.';
    }

    this._running = false;
    this._updateRate = Math.max(options.updateRate || 100, 10);
    this._callback = options.callback;
    this._fallback = typeof window.requestAnimationFrame === 'undefined' ||
                     options.disableRequestAnimationFrame|| false;

    if (!this._fallback) {
        this._callUpdate = this._scheduleAnimationFrame;
        this._scheduleUpdate = this._scheduleAnimationFrame;
    }

    this._boundCallUpdate = this._callUpdate.bind(this);
    this._boundUpdate = this._update.bind(this);

    this.reset();
}

ProgressTimer.prototype.set = function(position, duration) {
    if (arguments.length === 0) {
        throw 'set requires at least a position argument.';
    } else if (arguments.length === 1) {
        duration = this._state.duration;
    } else {
        duration = Math.floor(
            Math.max(duration === null ? Infinity : duration || 0, 0));
    }
    position = Math.floor(Math.min(Math.max(position || 0, 0), duration));

    this._state = {
        initialTimestamp: null,
        initialPosition: position,
        previousPosition: position,
        duration: duration
    };

    this._callback(position, duration, this._running);
    return this;
};

ProgressTimer.prototype.start = function() {
    this._running = true;
    this._callUpdate();
    return this;
};

ProgressTimer.prototype.stop = function() {
    this._running = false;
    var state = this._state;
    return this.set(state.previousPosition, state.duration);
};

ProgressTimer.prototype.reset = function() {
    this._running = false;
    return this.set(0, Infinity);
};

ProgressTimer.prototype._callUpdate = function() {
    this._update(now());
};

ProgressTimer.prototype._scheduleUpdate = function(timestamp) {
    var adjustedTimeout = timestamp + this._updateRate - now();
    setTimeout(this._boundCallUpdate, adjustedTimeout);
};

ProgressTimer.prototype._scheduleAnimationFrame = function() {
    window.requestAnimationFrame(this._boundUpdate);
};

ProgressTimer.prototype._update = function(timestamp) {
    if (!this._running) {
        return;
    }

    var state = this._state;
    state.initialTimestamp = state.initialTimestamp || timestamp;

    var position = state.initialPosition + timestamp - state.initialTimestamp;
    var duration = state.duration;

    if (position < duration || duration === null) {
        var delta = position - state.previousPosition;
        if (delta >= this._updateRate || this._fallback) {
            this._callback(Math.floor(position), duration, this._running);
            state.previousPosition = position;
        }
        this._scheduleUpdate(timestamp);
    } else {
        this._running = false;
        this._callback(duration, duration, this._running);
    }
};

if(typeof module !== 'undefined') {
    module.exports = ProgressTimer;
} else {
    window.ProgressTimer = ProgressTimer;
}

}());