const cache = {
    get: (name) => {
        let localStorage = window.localStorage;
        if (!localStorage) {
            return '';
        }
        return localStorage.getItem(name);
    },
    set: (name, value) => {
        let localStorage = window.localStorage;
        if (!localStorage) {
            return;
        }
        if (!value) {
            localStorage.removeItem(name);
            return;
        }
        localStorage.setItem(name, value);
    },
}

var awsLogin = new Vue({
    el: '#credentials-form',
    data: {
        accessKey: cache.get('awsWorkshopAccessKey'),
        secretKey: cache.get('awsWorkshopSecretKey'),
        region: 'eu-west-1',
        loading: false,
        statusMessage: "",
        aws: {
            accountId: "",
            userName: "",
        }
    },
    methods: {
        configureAws: function () {
            AWS.config.setPromisesDependency(Promise);
            AWS.config.update({
                region: this.region,
                credentials: new AWS.Credentials({
                    accessKeyId: this.accessKey.trim(),
                    secretAccessKey: this.secretKey.trim(),
                })
            });
        },
        login: async function (event) {
            // Configure AWS SDK
            this.configureAws();

            // Trying to login
            try {
                this.loading = true;
                let sts = new AWS.STS();
                let result = await sts.getCallerIdentity({}).promise();
                this.statusMessage = "Logged in as:\n" + JSON.stringify(result, null, 2);
                this.aws = {
                    accountId: result.Account,
                    userName: result.Arn.split('/aws-workshop/')[1],
                };
                this.loading = false;
            } catch (error) {
                this.statusMessage = 'ERROR: ' + error;
                this.loading = false;
                return;
            }

            // Cache valid credentials (for refresh of the page)
            cache.set('awsWorkshopAccessKey', this.accessKey);
            cache.set('awsWorkshopSecretKey', this.secretKey);

            // Do not refresh the page
            if (event) {
                event.preventDefault();
                return false;
            }
        },
        debugCloudTrail: async function () {
            // Configure AWS SDK
            this.configureAws();

            // Trying to fetch cloud trail data
            try {
                this.loading = true;
                let cl = new AWS.CloudTrail();
                let result = await cl.lookupEvents({
                    LookupAttributes: [
                        {
                            AttributeKey: 'Username',
                            AttributeValue: this.aws.userName,
                        }
                    ]
                }).promise();
                this.statusMessage = JSON.stringify(result, null, 2);
            } catch (error) {
                this.statusMessage = 'ERROR: ' + error;
            }
            this.loading = false;
        },
        debugScore: async function() {
             // Configure AWS SDK
             this.configureAws();

             // Trying to fetch cloud trail data
             try {
                 this.loading = true;
                 let result = await getScore(this.aws.userName);
                 this.statusMessage = JSON.stringify(result, null, 2);
             } catch (error) {
                 this.statusMessage = 'ERROR: ' + error;
             }
             this.loading = false;
        }
    }
});
