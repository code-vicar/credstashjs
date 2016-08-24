var crypto = require('crypto')

var aes = require('aes-js')
var AWS = require('aws-sdk')

/*
*  fetch and decrypt the secret called `name`
*/

module.exports = function getSecret(name, version, table, context) {
    if (!version || version === '_') {
        version = ''
    }
    if (!table || table === '_') {
        table = 'credential-store'
    }
    if (!context) {
        context = {}
    }

    var secrets = new AWS.DynamoDB.DocumentClient({
        params: {
            TableName: table
        }
    })

    var prom = (version === '') ? query(secrets, name) : get(secrets, name, version)

    return prom.then(function (material) {
        var kms = new AWS.KMS()

        // Check the HMAC before we decrypt to verify ciphertext integrity
        return new Promise(function (resolve, reject) {
            kms.decrypt({
                CiphertextBlob: new Buffer(material.key, 'base64'),
                EncryptionContext: context
            }, function (err, response) {
                try {
                    if (err) {
                        throw err
                    }

                    var key = response.data.Plaintext.slice(0, 32)
                    var hmac_key = response.data.Plaintext.slice(32)
                    var hmac = crypto.createHmac('sha256', hmac_key)
                    hmac.update(new Buffer(material.contents, 'base64'))
                    if (hmac.digest('hex') !== material.hmac) {
                        throw new Error(`Computed HMAC on ${name} does not match stored HMAC`)
                    }
                    var decryptor = new aes.ModeOfOperation.ctr(key)
                    var decrypted = decryptor.decrypt(new Buffer(material.contents, 'base64')).toString('utf-8')
                    return resolve(decrypted)
                } catch (e) {
                    return reject(e)
                }
            })
        })
    })
}

function query(dynamodbClient, name) {
    return new Promise(function (resolve, reject) {
        dynamodbClient.query({
            Limit: 1,
            ScanIndexForward: false,
            ConsistentRead: true,
            KeyConditionExpression: 'name = :name',
            ExpressionAttributeValues: {
                ':name': name
            }
        }, function (err, response) {
            if (err) {
                return reject(err)
            }

            if (response.data.Count === 0) {
                return reject(new Error(`Item {'name': '${name}'} couldn't be found`))
            }

            return resolve(response.data.Items[0])
        })
    })
}

function get(dynamodbClient, name, version) {
    return new Promise(function (resolve, reject) {
        dynamodbClient.get({
            Key: {
                'name': name,
                'version': version
            }
        }, function (err, response) {
            if (err) {
                return reject(err)
            }

            if (!response.data.Item) {
                return reject(new Error(`Item {'name': '${name}', 'version': '${version}'} couldn't be found.`))
            }

            return resolve(response.data.Item)
        })
    })
}
