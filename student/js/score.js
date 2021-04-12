let score = [
    {
        name: "sts GetCallerIdentity from UI",
        fancyname: "on the launch pad",
        selector: {
            "EventName": "GetCallerIdentity",
            "EventSource": "sts.amazonaws.com",
        }
    },
    {
        name: "ec2 DescribeInstances",
        fancyname: "on the launch pad",
        selector: {
            "EventName": "DescribeInstances",
            "EventSource": "ec2.amazonaws.com",
        }
    },
    {
        name: "ssm StartSession",
        fancyname: "on the launch pad",
        selector: {
            "EventName": "DescribeInstances",
            "EventSource": "ssm.amazonaws.com",
        }
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

function getScore(userName) {
    let cl = new AWS.CloudTrail();
    let fiveHours = 24 * 60 * 60;
    let requests = [];
    for (const item of score) {
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
        }).promise())
    }
    return Promise.all(requests)
}