const hasResult = (r) => r && r.Events.length > 0 ? 1 : 0;

const scoreTemplate = [
    {
        name: "sts GetCallerIdentity from UI",
        fancyName: "on the launch pad",
        selector: {
            "EventName": "GetCallerIdentity",
            "EventSource": "sts.amazonaws.com",
        },
        rawResult: null,
        logic: hasResult,
        score: 0,
    },
    {
        name: "login to console",
        fancyName: "on the launch pad",
        selector: {
            "eventName": "ConsoleLogin",
            "eventSource": "signin.amazonaws.com",
        },
        rawResult: null,
        logic: hasResult,
        score: 0,
    },
    {
        name: "ec2 DescribeInstances",
        fancyName: "on the launch pad",
        selector: {
            "EventName": "DescribeInstances",
            "EventSource": "ec2.amazonaws.com",
        },
        rawResult: null,
        logic: hasResult,
        score: 0,
    },
    {
        name: "ssm StartSession",
        fancyName: "on the launch pad",
        selector: {
            "EventName": "DescribeInstances",
            "EventSource": "ssm.amazonaws.com",
        },
        rawResult: null,
        logic: hasResult,
        score: 0,
    },
]

function selectorToLookupAttributes(selector) {
    let lookup = [];
    for (const item of Object.entries(selector)) {
        lookup.push({
            AttributeKey: item[0],
            AttributeValue: item[1],
        })
    }
    return lookup
}

function promisify(callback) {
    return new Promise((resolve, reject) => {
        try {
            resolve(callback())
        } catch (error) {
            reject(error);
        }
        
    })
}

function getScore(userName, oldScore) {
    let cl = new AWS.CloudTrail();
    let fiveHours = 24 * 60 * 60;
    let requests = [];
    for (const item of oldScore) {
        let selector = selectorToLookupAttributes(item.selector);
        selector.push({
            AttributeKey: 'Username',
            AttributeValue: userName,
        })
        let startTime = Math.floor(new Date().getTime() / 1000) - fiveHours;
        let endTime = Math.floor(new Date().getTime() / 1000) + fiveHours;
        requests.push(cl.lookupEvents({
            StartTime: startTime,
            EndTime: endTime,
            LookupAttributes: selector,
            MaxResults: 1 // Keeping responses small
        }).promise().then((awsResult) => promisify(() => {
            let updatedItem = item;
            updatedItem.rawResult = awsResult;
            updatedItem.score = updatedItem.logic(awsResult);
            return updatedItem;
        })))
    }
    return Promise.all(requests);
}

function minifiedScore(rawScore) {
    let result = [];
    for (const item of rawScore) {
        result.push({
            name: item.name,
            fancyName: item.fancyName,
            score: item.score,
        })
    }
    return result;
}

Vue.component('score', {
    template: `
    <div class="progress" v-bind:title="percentScore">
        <div class="determinate" v-bind:style="style"></div>
    </div>`,
    computed: {
        percentScore: function() {
            let max = this.scores.length;
            if (max == 0) {
                return 1 + '%';
            }
            let sum = this.scores.map(s => s.score).reduce((a, b) => a + b)
            return sum / max * 100 + '%';
        },
        style: function () {
            return {
                width: this.percentScore
            }
        },
    },
    props: {
        scores: {
            type: Array,
            required: true
        },
    }
});