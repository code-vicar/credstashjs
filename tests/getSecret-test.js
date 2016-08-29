var proxyquire = require('proxyquire')
var sinon = require('sinon')
var expect = require('chai').expect

describe('credstash', function () {
    beforeEach(function () {
        this.KMS = function () { }
        this.KMS.prototype.decrypt = mockKMS()

        this.DocumentClient = sinon.spy(function () { })
        this.DocumentClient.prototype.query = mockQuery()
        this.DocumentClient.prototype.get = mockGet()

        this.getSecret = proxyquire('../lib/getSecret', {
            'aws-sdk': {
                DynamoDB: {
                    DocumentClient: this.DocumentClient
                },
                KMS: this.KMS
            }
        })
    })

    it('can get secret', function () {
        return this.getSecret('secret').then((secret) => {
            expect(secret).to.equal('magic')
        })
    })

    it('can get secret with version', function () {
        return this.getSecret('secret', '1').then((secret) => {
            expect(secret).to.equal('magic')
        })
    })

    it('can get secret from alternative table', function () {
        return this.getSecret('secret', '_', 'another-table').then((secret) => {
            this.DocumentClient.calledWith({ params: { TableName: 'another-table' } })
            expect(secret).to.equal('magic')
        })
    })
})

var mockKMS = function () {
    return function (params, done) {
        var ret = {
            Plaintext: new Buffer('KvQ7FPrc2uYXHjW8n+Y63HHCvyRjujeaIZepV/eUkfkz8ZbM9oymmzC69+XLTlbtvRV1MNmo3ngqE+7dJHoDMw==', 'base64')
        }

        return done(null, ret)
    }
}

var mockQuery = function () {
    return function (params, done) {
        var ret = {
            Count: 1,
            Items: [{
                key: 'CiBzvX0zBm6hGu0EnbpRJ+eO+HfPOIsG5oq1UDiK+pi/vBLLAQEBAQB4c719MwZuoRrtBJ26USfnjvh3zziLBuaKtVA4ivqYv7wAAACiMIGfBgkqhkiG9w0BBwaggZEwgY4CAQAwgYgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMKNQYv5K9wPp+EvLQAgEQgFsITbvzf75MiY6aeIG2v/OzH2ThW5EJrfgNSekCGXONJSs3R8qkOlxFOfnoISvCXylMwBr+iAZFydgZiSyudPE+qocnYi++aVsv+iV9rR7o+FGQtSWKj2UH9PHm',
                hmac: 'ada335c27410033b16887d083aba629c17ad8f88b7982f331e4f6f8df92c41a9',
                contents: 'H2T+k+c='
            }]
        }

        return done(null, ret)
    }
}

var mockGet = function () {
    return function (params, done) {
        var ret = {
            Item: {
                key: 'CiBzvX0zBm6hGu0EnbpRJ+eO+HfPOIsG5oq1UDiK+pi/vBLLAQEBAQB4c719MwZuoRrtBJ26USfnjvh3zziLBuaKtVA4ivqYv7wAAACiMIGfBgkqhkiG9w0BBwaggZEwgY4CAQAwgYgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMKNQYv5K9wPp+EvLQAgEQgFsITbvzf75MiY6aeIG2v/OzH2ThW5EJrfgNSekCGXONJSs3R8qkOlxFOfnoISvCXylMwBr+iAZFydgZiSyudPE+qocnYi++aVsv+iV9rR7o+FGQtSWKj2UH9PHm',
                hmac: 'ada335c27410033b16887d083aba629c17ad8f88b7982f331e4f6f8df92c41a9',
                contents: 'H2T+k+c='
            }
        }

        return done(null, ret)
    }
}
