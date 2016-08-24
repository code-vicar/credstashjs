var getSecret = require('../lib/getSecret')
var expect = require('chai').expect
var AWS = require('aws-sdk-mock')

describe('credstash', () => {
    afterEach(() => {
        AWS.restore()
    })

    it('can get secret', () => {
        AWS.mock('DynamoDB.DocumentClient', 'query', mockQuery('credential-store'));

        AWS.mock('KMS', 'decrypt', mockKMS)
        return getSecret('secret').then(function (secret) {
            expect(secret).to.equal('magic')
        })
    })

    it.skip('can get secret with version', () => {
        AWS.mock('DynamoDB.DocumentClient', 'get', mockGet('credential-store'));

        AWS.mock('KMS', 'decrypt', mockKMS)
        return getSecret('secret', '1').then(function (secret) {
            expect(secret).to.equal('magic')
        })
    })

    // it.skip('can get N versions of a secret', (done) => {
    //     AWS.mock('DynamoDB', 'query', mockQueryWithTake('credential-store'))
    //     AWS.mock('KMS', 'decrypt', mockKMS)
    //     var credstash = new Credstash()
    //     return credstash.get('secret', { limit: 3 }, (e, secrets) => {
    //         should.not.exist(e)
    //         secrets[0].should.equal('magic')
    //         secrets[1].should.equal('magic')
    //         secrets[2].should.equal('magic')
    //         return done()
    //     })
    // })

    it.skip('can get secret from alternative table', () => {
        AWS.mock('DynamoDB', 'query', mockQuery('another-table'))
        AWS.mock('KMS', 'decrypt', mockKMS)
        return getSecret('secret', '_', 'another-table').then(function (secret) {
            expect(secret).to.equal('magic')
        })
    })
})

var mockKMS = (params, done) => {
    var ret = {
        data: {
            Plaintext: new Buffer('KvQ7FPrc2uYXHjW8n+Y63HHCvyRjujeaIZepV/eUkfkz8ZbM9oymmzC69+XLTlbtvRV1MNmo3ngqE+7dJHoDMw==', 'base64')
        }
    }

    return done(null, ret)
}

var mockQuery = (expectedTable) => {
    return (params, done) => {
        // expect(params.TableName).to.equal(expectedTable)
        var ret = {
            data: {
                Items: [{
                    key: 'CiBzvX0zBm6hGu0EnbpRJ+eO+HfPOIsG5oq1UDiK+pi/vBLLAQEBAQB4c719MwZuoRrtBJ26USfnjvh3zziLBuaKtVA4ivqYv7wAAACiMIGfBgkqhkiG9w0BBwaggZEwgY4CAQAwgYgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMKNQYv5K9wPp+EvLQAgEQgFsITbvzf75MiY6aeIG2v/OzH2ThW5EJrfgNSekCGXONJSs3R8qkOlxFOfnoISvCXylMwBr+iAZFydgZiSyudPE+qocnYi++aVsv+iV9rR7o+FGQtSWKj2UH9PHm',
                    hmac: 'ada335c27410033b16887d083aba629c17ad8f88b7982f331e4f6f8df92c41a9',
                    contents: 'H2T+k+c='
                }]
            }
        }

        return done(null, ret)
    }
}

var mockGet = (expectedTable) => {
    return (params, done) => {
        expect(params.TableName).to.equal(expectedTable)
        var ret = {
            data: {
                Item: {
                    key: 'CiBzvX0zBm6hGu0EnbpRJ+eO+HfPOIsG5oq1UDiK+pi/vBLLAQEBAQB4c719MwZuoRrtBJ26USfnjvh3zziLBuaKtVA4ivqYv7wAAACiMIGfBgkqhkiG9w0BBwaggZEwgY4CAQAwgYgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMKNQYv5K9wPp+EvLQAgEQgFsITbvzf75MiY6aeIG2v/OzH2ThW5EJrfgNSekCGXONJSs3R8qkOlxFOfnoISvCXylMwBr+iAZFydgZiSyudPE+qocnYi++aVsv+iV9rR7o+FGQtSWKj2UH9PHm',
                    hmac: 'ada335c27410033b16887d083aba629c17ad8f88b7982f331e4f6f8df92c41a9',
                    contents: 'H2T+k+c='
                }
            }
        }

        return done(null, ret)
    }
}

var mockQueryWithTake = (expectedTable) => {
    return (params, done) => {
        params.Limit.should.equal(3)
        params.TableName.should.equal(expectedTable)
        var ret = {
            Items: [{
                key: {
                    S: 'CiBzvX0zBm6hGu0EnbpRJ+eO+HfPOIsG5oq1UDiK+pi/vBLLAQEBAQB4c719MwZuoRrtBJ26USfnjvh3zziLBuaKtVA4ivqYv7wAAACiMIGfBgkqhkiG9w0BBwaggZEwgY4CAQAwgYgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMKNQYv5K9wPp+EvLQAgEQgFsITbvzf75MiY6aeIG2v/OzH2ThW5EJrfgNSekCGXONJSs3R8qkOlxFOfnoISvCXylMwBr+iAZFydgZiSyudPE+qocnYi++aVsv+iV9rR7o+FGQtSWKj2UH9PHm'
                },
                hmac: {
                    S: 'ada335c27410033b16887d083aba629c17ad8f88b7982f331e4f6f8df92c41a9'
                },
                contents: {
                    S: 'H2T+k+c='
                }
            }, {
                    key: {
                        S: 'CiBzvX0zBm6hGu0EnbpRJ+eO+HfPOIsG5oq1UDiK+pi/vBLLAQEBAQB4c719MwZuoRrtBJ26USfnjvh3zziLBuaKtVA4ivqYv7wAAACiMIGfBgkqhkiG9w0BBwaggZEwgY4CAQAwgYgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMKNQYv5K9wPp+EvLQAgEQgFsITbvzf75MiY6aeIG2v/OzH2ThW5EJrfgNSekCGXONJSs3R8qkOlxFOfnoISvCXylMwBr+iAZFydgZiSyudPE+qocnYi++aVsv+iV9rR7o+FGQtSWKj2UH9PHm'
                    },
                    hmac: {
                        S: 'ada335c27410033b16887d083aba629c17ad8f88b7982f331e4f6f8df92c41a9'
                    },
                    contents: {
                        S: 'H2T+k+c='
                    }
                }, {
                    key: {
                        S: 'CiBzvX0zBm6hGu0EnbpRJ+eO+HfPOIsG5oq1UDiK+pi/vBLLAQEBAQB4c719MwZuoRrtBJ26USfnjvh3zziLBuaKtVA4ivqYv7wAAACiMIGfBgkqhkiG9w0BBwaggZEwgY4CAQAwgYgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMKNQYv5K9wPp+EvLQAgEQgFsITbvzf75MiY6aeIG2v/OzH2ThW5EJrfgNSekCGXONJSs3R8qkOlxFOfnoISvCXylMwBr+iAZFydgZiSyudPE+qocnYi++aVsv+iV9rR7o+FGQtSWKj2UH9PHm'
                    },
                    hmac: {
                        S: 'ada335c27410033b16887d083aba629c17ad8f88b7982f331e4f6f8df92c41a9'
                    },
                    contents: {
                        S: 'H2T+k+c='
                    }
                }]
        }

        return done(null, ret)
    }
}