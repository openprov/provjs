/**
 * API to post provenance documents to the ProvStore
 *
 * Created by tdh on 21/01/2014.
 *
 * Copyright 2014 University of Southampton - All rights reserved.
 * Licence: To be determined
 */

(function (window, undefined) {
    "use strict";

    var http = require('http'),
        https = require('https'),
        url = require('url');

    function ProvStore(location, username, apikey) {
        var parts = url.parse(location);
        this.http = (parts.protocol === 'https:') ? https : http;
        this.hostname = parts.hostname;
        this.path = parts.path;
        // TODO Handle location with port information
        this._authorizationHeader = "ApiKey " + username + ":" + apikey;
    }

    ProvStore.prototype = {
        constructor: ProvStore,
        request: function (path, data, method, callback, error) {
            var jsonDataStr = JSON.stringify(data);
            var headers = {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Content-Length': jsonDataStr.length,
                Authorization: this._authorizationHeader
            };
            var options = {
                hostname: this.hostname,
                path: this.path + path,
                method: method || 'GET',
                headers: headers
            };
            var req = this.http.request(options, function(response) {
                var dataStr = '';
                response.setEncoding('utf8');
                response.on('data', function (chunk) {
                    dataStr += chunk;
                });
                response.on('end', function (){
                    var result;
                    try {
                        // Try to parse the result as JSON
                        result = JSON.parse(dataStr);
                    }
                    catch (err) {
                        // Return the result as-is
                        result = dataStr;
                    }
                    callback(result);
                });
            });

            req.on('error', function(e) {
                error(e);
            });

            // write data to request body
            req.write(jsonDataStr);
            req.end();
        },
        submitDocument: function (identifier, prov_document, isPublic, callback, err) {
            if (isPublic === undefined) {
                isPublic = false;
            }
            var data = {
                'content': prov_document,
                'public': isPublic,
                'rec_id': identifier || null
            };
            this.request('documents/', data, 'POST', function (response) {
                console.log(response.id);
            }, err);
        },
        listDocuments: function (offset, limit, callback, err) {
            var data = {};
            if (offset) {
                data.offset = offset;
            }
            if (limit) {
                data.limit = limit;
            }
            this.request('documents/', data, 'GET', callback, err);
        },
        getDocument: function (provstore_id, callback, err) {
            this.request('documents/' + provstore_id + '/', null, 'GET', callback, err);
        },
        getDocumentContent: function (provstore_id, format, callback, err) {
            this.request('documents/' + provstore_id + '.' + format, null, 'GET', callback, err);
        },
        deleteDocument: function (provstore_id, callback, err) {
            this.request('documents/' + provstore_id + '/', null, 'DELETE', callback, err);
        },
        addBundle: function (id, identifier, prov_bundle, callback, err) {
            var data = {
                content: prov_bundle,
                rec_id: identifier
            };
            this.request('documents/' + id + '/bundles/', data, 'POST', callback, err);
        }
    };

    // export as Common JS module...
    if (typeof module !== "undefined" && module.exports) {
        module.exports = ProvStore;
    }

    // ... or as AMD module
    else if (typeof define === "function" && define.amd) {
        define(function () {
            return ProvStore;
        });
    }

    // ... or as browser global
    else {
        global.Ractive = ProvStore;
    }

}(typeof window !== 'undefined' ? window : this));