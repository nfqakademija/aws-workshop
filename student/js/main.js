var awsLogin = new Vue({
    el: '#spa',
    data: function () {
        return {
            accessKey: Config.aws.accessKey,
            secretKey: Config.aws.secretKey,
            region: Config.aws.region,
            loading: false,
            statusMessage: "",
            aws: {
                accountId: Config.aws.accountId,
                userName: Config.aws.userName,
                password: Config.aws.password
            },
            storage: {
                scoresBucket: Config.storage.scoresBucket,
                maxScore: 20
            },
            personalScore: [],
        };
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
                let startTime = Math.floor(new Date().getTime() / 1000) - (60*30);
                let result = await cl.lookupEvents({
                    StartTime: startTime,
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
                 let result = await getScore(this.aws.userName, scoreTemplate);
                 this.statusMessage = JSON.stringify(result, null, 2);
                 this.personalScore = minifiedScore(result);
             } catch (error) {
                 this.statusMessage = 'ERROR: ' + error;
             }
             this.loading = false;
        },
        debugLambda: async function() {
             // Configure AWS SDK
             this.configureAws();

             // Trying to fetch cloud trail data
             try {
                 this.loading = true;
                 var lambda = new AWS.Lambda();
                 let result = await lambda.invoke({
                    FunctionName: Config.lambda.checkTask,
                    Payload: JSON.stringify({
                        "some": "data"
                    }),
                    ClientContext: btoa(JSON.stringify({"my": {"caller": "context"}}))
                 }).promise();
                 this.statusMessage = "Status: " + result.StatusCode + "\n" + JSON.stringify(JSON.parse(result.Payload), null, 2);
             } catch (error) {
                 this.statusMessage = 'ERROR: ' + error;
             }
             this.loading = false;
            
        }
    }
});
