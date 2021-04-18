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
            students: Config.students,
            showPasswords: false
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
    }
});
