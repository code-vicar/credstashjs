var crypto = require('crypto')

var base64 = require('base-64')
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

    const secrets = new AWS.DynamoDB.DocumentClient({
        params: {
            TableName: table
        }
    })

    let prom = (version === '') ? query(secrets, name) : get(secrets, name, version)

    return prom.then(function (material) {
        const kms = new AWS.KMS()

        // Check the HMAC before we decrypt to verify ciphertext integrity
        return new Promise(function (resolve, reject) {
            kms.decrypt({
                CiphertextBlob: base64.decode(material.key),
                EncryptionContext: context
            }, function (err, response) {
                try {
                    if (err) {
                        throw err
                    }

                    var key = response.data.Plaintext.slice(0, 32)
                    var hmac_key = response.data.Plaintext.slice(32)
                    var hmac = crypto.createHmac('sha256', hmac_key)
                    hmac.update(base64.decode(material.contents))
                    if (hmac.digest('hex') !== material.hmac) {
                        throw new Error(`Computed HMAC on ${name} does not match stored HMAC`)
                    }

                    var decryptor = crypto.createDecipher('aes-128-ctr', key)
                    return resolve(decryptor.update(material.contents, 'base64', 'utf8') + decryptor.final('utf8'))
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
