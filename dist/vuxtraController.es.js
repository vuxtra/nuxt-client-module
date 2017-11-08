/*!
 * Vuxtra.js v0.1.3
 * (c) 2017-2017 Faruk Brbovic
 * Released under the MIT License.
 */
import socketclusterClient from 'socketcluster-client';
import path from 'path';
import _ from 'lodash';

class Request {
    constructor (rawRequest = null) {
        this._messageType = 'req';
        if (rawRequest === null) {
            rawRequest = {};
        }
        this.meta   = (typeof rawRequest.meta !== 'undefined' && rawRequest.meta !== null ? rawRequest.meta : {});
        this.data   = (typeof rawRequest.data !== 'undefined' ? rawRequest.data : null);
        this.id     = (typeof rawRequest.id !== 'undefined' ? rawRequest.id : null);
        this.type   = (typeof rawRequest.type !== 'undefined' ? rawRequest.type : 'generic');
    }
    // setters
    setData(data) {
        this.data = data;
        return this
    }
    setMeta(key, val) {
        this.meta[key] = val;
        return this
    }
    setId(id) {
        this.id = id;
        return this
    }
    setType(type) {
        this.type = type;
        return this
    }
    // getters
    getData() {
        return this.data
    }
    getMeta(key, defaultVal = null) {
        if (typeof this.meta[key] !== 'undefined') {
            return this.meta[key]
        }
        return defaultVal
    }
    getId(id) {
        return this.id
    }
    getType(type) {
        return this.type
    }
}

class ServiceRequest extends Request {
    constructor (rawRequest = null) {
        super(rawRequest);
        // if blank than we set the service
        if (rawRequest === null) {
            this.setType('service');
        }
    }

    setServiceName(serviceName) {
        this.setMeta('serName', serviceName);
        return this
    }

    setServiceAction(serviceAction) {
        this.setMeta('serAction', serviceAction);
        return this
    }

    getServiceName() {
        return this.getMeta('serName')
    }

    getServiceAction() {
        return this.getMeta('serAction')
    }
}

class Response {
    constructor (rawResponse = {}) {
        this._messageType = 'res';
        this.meta = (typeof rawResponse.meta !== 'undefined' && rawResponse.meta !== null ? rawResponse.meta : {});
        this.data = (typeof rawResponse.data !== 'undefined' ? rawResponse.data : null);
        this.id = (typeof rawResponse.id !== 'undefined' ? rawResponse.id : null);
        this.type = (typeof rawResponse.type !== 'undefined' ? rawResponse.type : 'generic');
        this.statusCode = (typeof rawResponse.statusCode !== 'undefined' ? rawResponse.statusCode : 200);
        this.statusMessage = (typeof rawResponse.statusMessage !== 'undefined' ? rawResponse.statusMessage : 'success');
    }

    // setters
    setData(data) {
        this.data = data;
        return this
    }
    setMeta(key, val) {
        this.meta[key] = val;
        return this
    }
    setId(id) {
        this.id = id;
        return this
    }
    setType(type) {
        this.type = type;
        return this
    }
    ss(code, message = null) {
        this.statusCode = code;
        this.statusMessage = message;
        return this
    }
    ssSuccess(msg = 'success') {
        this.statusCode = 200;
        this.statusMessage = msg;
        return this
    }
    ssClientError(msg = 'Client Error') {
        this.statusCode = 400;
        this.statusMessage = msg;
        return this
    }
    ssClientErrorNotFound(msg = 'Client Error: Not Found') {
        this.statusCode = 404;
        this.statusMessage = msg;
        return this
    }
    ssClientErrorInvalidRequest(msg = 'Client Error: Not Found') {
        this.statusCode = 404;
        this.statusMessage = msg;
        return this
    }
    ssServerError(msg = 'Server Error') {
        this.statusCode = 500;
        this.statusMessage = msg;
        return this
    }

    // getters
    getData() {
        return this.data
    }
    getMeta(key, defaultVal = null) {
        if (typeof this.meta[key] !== undefined) {
            return this.meta[key]
        }
        return defaultVal
    }
    getId(id) {
        return this.id
    }
    getType(type) {
        return this.type
    }
    getStatusCode() {
        return this.statusCode
    }
    getStatusMessage() {
        return this.statusMessage
    }

    // checkers
    isStatusSuccess() {
        if (this.statusCode >= 200 && this.statusCode <300) {
            return true;
        }
        return false
    }
    isStatusError() {
        if (this.statusCode >= 400 && this.statusCode <600) {
            return true;
        }
        return false
    }
}

class ServiceResponse extends Response {
    constructor (rawRequest = {}) {
        super(rawRequest);
        this.setType('service');
    }

    setServiceName(serviceName) {
        this.setMeta('serName', serviceName);
        return this
    }

    setServiceAction(serviceAction) {
        this.setMeta('serAction', serviceAction);
        return this
    }

    getServiceName() {
        return this.getMeta('serName')
    }


    getServiceAction() {
        return this.getMeta('serAction')
    }


}

var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();



var asyncToGenerator = function (fn) {
  return function () {
    var gen = fn.apply(this, arguments);
    return new Promise(function (resolve, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg);
          var value = info.value;
        } catch (error) {
          reject(error);
          return;
        }

        if (info.done) {
          resolve(value);
        } else {
          return Promise.resolve(value).then(function (value) {
            step("next", value);
          }, function (err) {
            step("throw", err);
          });
        }
      }

      return step("next");
    });
  };
};

let privateData = new WeakMap();

class VuxtraController {
    constructor(options) {
        this.socketclusterClient = socketclusterClient;
        this._internalRequestCounter = 1;
        this._internalSocketConnected = false;
        privateData.set(this, { options: options });
        // privateData.get(this).options;
        this.socket = this.socketclusterClient.connect({
            port: options.port || 80,
            hostname: options.hostname || 'localhost'
        });
        this.socket.on('connect', function () {
            this._internalSocketConnected = true;
        });

        var $_internalService = (callArguments, options, action) => {
            return new Promise((resolve, reject) => {
                this.doBindOrExecute(() => {
                    let request = new ServiceRequest();
                    request.setServiceName(options).setServiceAction(action).setData(callArguments).setId(this.socket.id + this._internalRequestCounter);
                    this._internalRequestCounter++;
                    this.socket.emit('service.call', request, function (err, res) {
                        if (err) {
                            reject(err);
                        } else {
                            let response = new ServiceResponse(res);
                            resolve(response);
                        }
                    });
                });
            });
        };

        this.services = require(path.resolve(__dirname, './.nuxt/clientVuxtra.js')).services($_internalService, this);
    }

    doBindOrExecute(func) {
        if (this._internalSocketConnected !== true) {
            this.socket.on('connect', function () {
                func();
            });
        } else {
            func();
        }
    }

    /**
     * Makes a realtime service call to the backend via socket
     *
     * @param requestFunc callback function / closure which gets ServiceRequest Object as it's first parameter (serviceRequest) => { serviceRequest.setData('hello') }
     * @param data  payload to be passed to service method
     * @returns {Promise}
     */
    call(requestFunc) {
        var _this = this;

        return asyncToGenerator(function* () {

            if (!_.isFunction(requestFunc)) {
                throw Error('requestFunc [ first param ] must of function tyupe');
            }
            let request = new ServiceRequest();
            requestFunc(request);
            return new Promise(function (resolve, reject) {
                _this.socket.emit('service.call', request, function (err, res) {
                    if (err) {
                        reject(err);
                    } else {
                        let response = new ServiceResponse(res);
                        resolve(response);
                    }
                });
            });
        })();
    }
}

export default VuxtraController;
//# sourceMappingURL=vuxtraController.es.js.map
