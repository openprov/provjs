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
                console.log('STATUS: ' + response.statusCode);
                console.log('HEADERS: ' + JSON.stringify(response.headers));
                response.setEncoding('utf8');
                response.on('data', function (chunk) {
                    console.log('BODY: ' + chunk);
                    dataStr += chunk;
                });
                response.on('end', function (){
                    var result = JSON.parse(dataStr);
                    callback(result);
                });
            });

            req.on('error', function(e) {
                console.log('problem with request: ' + e.message);
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
        }
        // TODO: listDocuments
        // TODO: getDocument
        // TODO: getDocumentContent
        // TODO: deleteDocument
        // TODO: addBundle
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