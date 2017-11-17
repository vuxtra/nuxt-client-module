import socketclusterClient from 'socketcluster-client'
import { ServiceRequest, ServiceResponse } from '@vuxtra/shared-core'
import _ from 'lodash'

let privateData = new WeakMap();

var $_internal

export default class VuxtraController {
    constructor (options) {
        this.socketclusterClient = socketclusterClient
        this._internalRequestCounter = 1
        this._internalSocketConnected = false
        privateData.set(this, { options: options })
        // privateData.get(this).options;
        this.socket = this.socketclusterClient.connect({
            port: options.port || 80,
            hostname: options.hostname || 'localhost'
        })
        this.socket.on('connect', function () {
            this._internalSocketConnected = true
        });

        let $_doBindOrExecute = (func) => {
            if(this._internalSocketConnected !== true) {
                this.socket.on('connect', () => {
                    this._internalSocketConnected = true;
                    func();
                });
            }
            else {
                func();
            }
        }

        let $_internalService = ( callArguments, options, action ) => {
            return new Promise((resolve, reject)  => {
                $_doBindOrExecute(() => {
                    let request = new ServiceRequest()
                    request.setServiceName(options)
                        .setServiceAction(action)
                        .setData(callArguments)
                        .setId(this.socket.id + this._internalRequestCounter)
                    this._internalRequestCounter++
                    this.socket.emit('service.call', request, function (err, res) {
                        if (err) {
                            reject(err)
                        } else {
                            let response = new ServiceResponse(res)
                            resolve(response)
                        }
                    })

                })
            })
        }

        this.services = require('~/.vuxtra/clientVuxtra.js').services($_internalService, this)

    }

}