const hasResult = (r) => r && r.Events.length > 0 ? 1 : 0;

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

const defaultRefreshSeconds = 100;

Vue.component('score-item', {
    template: `<div v-bind:class="className" v-bind:title="icon.name"><slot></slot></div>`,
    props: {
        icon: {
            type: Object,
            required: true,
        }
    },
    computed: {
        className: function () {
            const defaultClass = 'score__icon score__icon--hooper';
            if (this.icon.passed) {
                return defaultClass + ' score__icon--hooper';
            }
            return defaultClass + ' score__icon--hooper-transparent';
        }
    }
});

function fillObjects(grouped, filler, max) {
    for (const key in grouped) {
        for (let i = grouped[key].length; i < max; i++) {
            grouped[key].push(filler);
        }
    }
    return grouped;
}

function fillKeys(grouped, keys) {
    for (const key of keys) {
        if (!grouped.hasOwnProperty(key)) {
            grouped[key] = [];
        }
    }
    return grouped;
}

Vue.component('score', {
    template: `
    <div>
        <div class="score__refresh-line">
            {{statusMessage}}
            <button v-if="tillRefresh > 1" v-on:click="refreshNow" class="btn waves-effect waves-light btn-small" type="button">Refresh now</button>
            </div>
        <div v-if="players.length < 1" class="progress" v-bind:title="percentScore">
            <div class="determinate" v-bind:style="style"></div>
        </div>
        <div class="score__icons">
            <div v-for="(icons, username) in byUserName" v-bind:key="username" class="score__icon_plane">
                <div class="score__username" v-if="players.length > 1">{{username}}:</div>
                <score-item v-for="(icon, index) in icons" v-bind:key="index" v-bind:icon="icon">{{index+1}}</score-item>
            </div>
        </div>
    </div>`,
    props: {
        storage: {
            type: String,
            required: true
        },
        max: {
            type: Number,
            required: true
        },
        username: {
            type: String,
            default: ''
        },
        players: {
            type: Array,
            default: function () {
                return [];
            }
        }
    },
    data() {
        return {
            tillRefresh: 10,
            statusMessage: "Loading...",
            isTruncated: false,
            contents: [
                {
                    "Key": "aurelijus.banelis@nfq.lt/0.1.SystemTest.json",
                    "LastModified": "[native Date Sun Apr 18 2021 12:32:30 GMT+0300 (Eastern European Summer Time)]",
                    "ETag": "\"20470b64ef2735251811881d8e6e354a\"",
                    "Size": 39,
                    "StorageClass": "STANDARD"
                }
            ],
        }
    },
    mounted() {
        setTimeout(this.countdown, 500);
    },
    computed: {
        percentScore: function () {
            return (this.contents.length / this.max * 100) + '%'
        },
        style: function () {
            return {
                width: this.percentScore
            }
        },
        byUserName: function () {
            let result = fillKeys({}, this.players);
            for (const item of this.contents) {
                const [userName, fileName] = item.Key.split('/')
                const taskName = fileName.replace(/\.json/, '')
                if (!result.hasOwnProperty(userName)) {
                    result[userName] = [];
                }
                result[userName].push({
                    passed: true,
                    name: taskName
                })
            }
            const filler = {
                passed: false,
                name: 'future task-resources'
            }

            return fillObjects(result, filler, this.max);
        },
    },
    methods: {
        refreshNow() {
            this.tillRefresh = 0;
            this.statusMessage = "Refreshing..."
        },
        async countdown() {
            if (this.tillRefresh <= 0) {
                await this.fetchLatest();
                return;
            }
            this.statusMessage = "Will check again in: " + this.tillRefresh + 's...';
            this.tillRefresh -= 1;
            const second = 1000;
            setTimeout(this.countdown, second);
        },
        async fetchLatest() {
            this.statusMessage = "Fetching latest score...";
            try {
                this.$parent.configureAws();
                const s3 = new AWS.S3({apiVersion: '2006-03-01'});
                let result = await s3.listObjectsV2({
                    Bucket: this.storage,
                    Prefix: this.username ? `${this.username}/` : undefined,
                }).promise();
                this.isTruncated = result.IsTruncated;
                this.contents = result.Contents;
                this.statusMessage = "Updated"
                this.tillRefresh = defaultRefreshSeconds;
                await this.countdown();
            } catch (error) {
                console.error('SCORE fetch error', error);
                this.statusMessage = "ERROR: " + error
            }
        }
    }
});