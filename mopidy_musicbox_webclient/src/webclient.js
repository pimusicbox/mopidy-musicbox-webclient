/*global module:true, require:false*/

// Based on https://github.com/mopidy/mopidy.js, with only the
// function name 'Mopidy' changed to 'Webclient', and webSocketUrl
// changed from '/mopidy/ws' to '/musicbox_webclient/ws'.

var bane = require('bane')
var websocket = require('../lib/websocket/')
var when = require('when')

function Webclient (settings) {
    if (!(this instanceof Webclient)) {
        return new Webclient(settings)
    }

    this._console = this._getConsole(settings || {})
    this._settings = this._configure(settings || {})

    this._backoffDelay = this._settings.backoffDelayMin
    this._pendingRequests = {}
    this._webSocket = null

    bane.createEventEmitter(this)
    this._delegateEvents()

    if (this._settings.autoConnect) {
        this.connect()
    }
}

Webclient.ConnectionError = function (message) {
    this.name = 'ConnectionError'
    this.message = message
}
Webclient.ConnectionError.prototype = Object.create(Error.prototype)
Webclient.ConnectionError.prototype.constructor = Webclient.ConnectionError

Webclient.ServerError = function (message) {
    this.name = 'ServerError'
    this.message = message
}
Webclient.ServerError.prototype = Object.create(Error.prototype)
Webclient.ServerError.prototype.constructor = Webclient.ServerError

Webclient.WebSocket = websocket.Client

Webclient.when = when

Webclient.prototype._getConsole = function (settings) {
    if (typeof settings.console !== 'undefined') {
        return settings.console
    }

    var con = typeof console !== 'undefined' && console || {}

    con.log = con.log || function () {}
    con.warn = con.warn || function () {}
    con.error = con.error || function () {}

    return con
}

Webclient.prototype._configure = function (settings) {
    var protocol = (typeof document !== 'undefined' &&
        document.location.protocol === 'https:') ? 'wss://' : 'ws://'
    var currentHost = (typeof document !== 'undefined' &&
        document.location.host) || 'localhost'
    settings.webSocketUrl = settings.webSocketUrl ||
        protocol + currentHost + '/musicbox_webclient/ws'

    if (settings.autoConnect !== false) {
        settings.autoConnect = true
    }

    settings.backoffDelayMin = settings.backoffDelayMin || 1000
    settings.backoffDelayMax = settings.backoffDelayMax || 64000

    if (typeof settings.callingConvention === 'undefined') {
        this._console.warn(
            'Webclient.js is using the default calling convention. The ' +
            'default will change in the future. You should explicitly ' +
            'specify which calling convention you use.')
    }
    settings.callingConvention = (
        settings.callingConvention || 'by-position-only')

    return settings
}

Webclient.prototype._delegateEvents = function () {
    // Remove existing event handlers
    this.off('websocket:close')
    this.off('websocket:error')
    this.off('websocket:incomingMessage')
    this.off('websocket:open')
    this.off('state:offline')

    // Register basic set of event handlers
    this.on('websocket:close', this._cleanup)
    this.on('websocket:error', this._handleWebSocketError)
    this.on('websocket:incomingMessage', this._handleMessage)
    this.on('websocket:open', this._resetBackoffDelay)
    this.on('websocket:open', this._getApiSpec)
    this.on('state:offline', this._reconnect)
}

Webclient.prototype.connect = function () {
    if (this._webSocket) {
        if (this._webSocket.readyState === Webclient.WebSocket.OPEN) {
            return
        } else {
            this._webSocket.close()
        }
    }

    this._webSocket = this._settings.webSocket ||
        new Webclient.WebSocket(this._settings.webSocketUrl)

    this._webSocket.onclose = function (close) {
        this.emit('websocket:close', close)
    }.bind(this)

    this._webSocket.onerror = function (error) {
        this.emit('websocket:error', error)
    }.bind(this)

    this._webSocket.onopen = function () {
        this.emit('websocket:open')
    }.bind(this)

    this._webSocket.onmessage = function (message) {
        this.emit('websocket:incomingMessage', message)
    }.bind(this)
}

Webclient.prototype._cleanup = function (closeEvent) {
    Object.keys(this._pendingRequests).forEach(function (requestId) {
        var resolver = this._pendingRequests[requestId]
        delete this._pendingRequests[requestId]
        var error = new Webclient.ConnectionError('WebSocket closed')
        error.closeEvent = closeEvent
        resolver.reject(error)
    }.bind(this))

    this.emit('state:offline')
}

Webclient.prototype._reconnect = function () {
    this.emit('reconnectionPending', {
        timeToAttempt: this._backoffDelay
    })

    setTimeout(function () {
        this.emit('reconnecting')
        this.connect()
    }.bind(this), this._backoffDelay)

    this._backoffDelay = this._backoffDelay * 2
    if (this._backoffDelay > this._settings.backoffDelayMax) {
        this._backoffDelay = this._settings.backoffDelayMax
    }
}

Webclient.prototype._resetBackoffDelay = function () {
    this._backoffDelay = this._settings.backoffDelayMin
}

Webclient.prototype.close = function () {
    this.off('state:offline', this._reconnect)
    this._webSocket.close()
}

Webclient.prototype._handleWebSocketError = function (error) {
    this._console.warn('WebSocket error:', error.stack || error)
}

Webclient.prototype._send = function (message) {
    switch (this._webSocket.readyState) {
        case Webclient.WebSocket.CONNECTING:
            return when.reject(
            new Webclient.ConnectionError('WebSocket is still connecting'))
        case Webclient.WebSocket.CLOSING:
            return when.reject(
            new Webclient.ConnectionError('WebSocket is closing'))
        case Webclient.WebSocket.CLOSED:
            return when.reject(
            new Webclient.ConnectionError('WebSocket is closed'))
        default:
            var deferred = when.defer()
            message.jsonrpc = '2.0'
            message.id = this._nextRequestId()
            this._pendingRequests[message.id] = deferred.resolver
            this._webSocket.send(JSON.stringify(message))
            this.emit('websocket:outgoingMessage', message)
            return deferred.promise
    }
}

Webclient.prototype._nextRequestId = (function () {
    var lastUsed = -1
    return function () {
        lastUsed += 1
        return lastUsed
    }
}())

Webclient.prototype._handleMessage = function (message) {
    try {
        var data = JSON.parse(message.data)
        if (data.hasOwnProperty('id')) {
            this._handleResponse(data)
        } else if (data.hasOwnProperty('event')) {
            this._handleEvent(data)
        } else {
            this._console.warn(
                'Unknown message type received. Message was: ' +
                message.data)
        }
    } catch (error) {
        if (error instanceof SyntaxError) {
            this._console.warn(
                'WebSocket message parsing failed. Message was: ' +
                message.data)
        } else {
            throw error
        }
    }
}

Webclient.prototype._handleResponse = function (responseMessage) {
    if (!this._pendingRequests.hasOwnProperty(responseMessage.id)) {
        this._console.warn(
            'Unexpected response received. Message was:', responseMessage)
        return
    }

    var error
    var resolver = this._pendingRequests[responseMessage.id]
    delete this._pendingRequests[responseMessage.id]

    if (responseMessage.hasOwnProperty('result')) {
        resolver.resolve(responseMessage.result)
    } else if (responseMessage.hasOwnProperty('error')) {
        error = new Webclient.ServerError(responseMessage.error.message)
        error.code = responseMessage.error.code
        error.data = responseMessage.error.data
        resolver.reject(error)
        this._console.warn('Server returned error:', responseMessage.error)
    } else {
        error = new Error('Response without "result" or "error" received')
        error.data = {response: responseMessage}
        resolver.reject(error)
        this._console.warn(
            'Response without "result" or "error" received. Message was:',
            responseMessage)
    }
}

Webclient.prototype._handleEvent = function (eventMessage) {
    var type = eventMessage.event
    var data = eventMessage
    delete data.event

    this.emit('event:' + this._snakeToCamel(type), data)
}

Webclient.prototype._getApiSpec = function () {
    return this._send({method: 'webclient.describe'})
        .then(this._createApi.bind(this))
        .catch(this._handleWebSocketError)
}

Webclient.prototype._createApi = function (methods) {
    var byPositionOrByName = (
        this._settings.callingConvention === 'by-position-or-by-name')

    var caller = function (method) {
        return function () {
            var message = {method: method}
            if (arguments.length === 0) {
                return this._send(message)
            }
            if (!byPositionOrByName) {
                message.params = Array.prototype.slice.call(arguments)
                return this._send(message)
            }
            if (arguments.length > 1) {
                return when.reject(new Error(
                    'Expected zero arguments, a single array, ' +
                    'or a single object.'))
            }
            if (!Array.isArray(arguments[0]) &&
                arguments[0] !== Object(arguments[0])) {
                return when.reject(new TypeError(
                    'Expected an array or an object.'))
            }
            message.params = arguments[0]
            return this._send(message)
        }.bind(this)
    }.bind(this)

    var getPath = function (fullName) {
        var path = fullName.split('.')
        if (path.length >= 1 && path[0] === 'webclient') {
            path = path.slice(1)
        }
        return path
    }

    var createObjects = function (objPath) {
        var parentObj = this
        objPath.forEach(function (objName) {
            objName = this._snakeToCamel(objName)
            parentObj[objName] = parentObj[objName] || {}
            parentObj = parentObj[objName]
        }.bind(this))
        return parentObj
    }.bind(this)

    var createMethod = function (fullMethodName) {
        var methodPath = getPath(fullMethodName)
        var methodName = this._snakeToCamel(methodPath.slice(-1)[0])
        var object = createObjects(methodPath.slice(0, -1))
        object[methodName] = caller(fullMethodName)
        object[methodName].description = methods[fullMethodName].description
        object[methodName].params = methods[fullMethodName].params
    }.bind(this)

    Object.keys(methods).forEach(createMethod)
    this.emit('state:online')
}

Webclient.prototype._snakeToCamel = function (name) {
    return name.replace(/(_[a-z])/g, function (match) {
        return match.toUpperCase().replace('_', '')
    })
}

module.exports = Webclient
