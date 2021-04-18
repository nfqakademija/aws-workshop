const {valid, contains, sanitisedName} = require('./validation');
const aws = require('aws-sdk');
const s3 = new aws.S3({apiVersion: '2006-03-01'});
aws.config.setPromisesDependency(Promise);

exports.hadnler = async (event, context) => {
    const task = event.task;
    if (!valid.hasOwnProperty(task)) {
        return {
            success: false,
            error: "unknown task",
            input: event
        }
    }
    if (!(context.clientContext instanceof Object) || !context.clientContext.hasOwnProperty('player')) {
        return {
            success: false,
            error: "unknown context/player",
            input: event
        }
    }
    const player = context.clientContext.player;
    if (!contains(event, valid[task])) {
        return {
            success: false,
            error: "bad answer; use hints and try again",
            input: event
        }
    }

    try {
        let result = await s3.putObject({
            Body: JSON.stringify(event),
            Bucket: process.env.SCORES_S3_NAME,
            Key: sanitisedName(player) + '/' + sanitisedName(task) + '.json',
            ContentType: "application/json"
        }).promise();

        return {
            success: true,
            storageResult: result,
        }
    } catch (error) {
        console.error(event, context.clientContext, error);
        return {
            success: false,
            error: "failed mark valid result in S3: " + error,
            input: event
        }
    }
}