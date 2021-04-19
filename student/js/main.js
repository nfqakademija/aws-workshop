var awsLogin = new Vue({
    el: '#spa',
    data: function () {
        return {
            initialization: {
                userName: "",
                company: "",
                valid: true,
            },
            gameConfig: {
                aws: {
                    region: "eu-west-1",
                    accessKey: "",
                    secretKey: "",
                    accountId: "",
                    userName: "",
                    password: "",
                },
                lambda: {
                    checkTask: "",
                },
                storage: {
                    scoresBucket: "",
                }
            },
            loading: false,
            statusMessage: "",
            showPasswords: false
        };
    },
    computed: {
        configFile: function () {
            // Should be aligned with same logic in workshopUsers.js
            let name = this.initialization.company + '-' + this.initialization.userName;
            name = name.replace(/[^a-z0-9-]/ig, '-').toLowerCase()
            return name + ".js";
        },
    },
    methods: {
        loadConfigKey: async function (e) {
            this.initialization.valid = true;
            if (!this.initialization.company || !this.initialization.userName) {
                return;
            }
            const enterKey = 13;
            if (e.keyCode === enterKey) {
                await this.loadConfig();
            }
        },
        setConfig: function (newConfig) {
            // Do not understand how to properly use this.$set, so using old school way
            console.log('OLDConfig', this.gameConfig);
            console.log('newConfig', newConfig);

            this.gameConfig.aws.region = newConfig.aws.region;
            this.gameConfig.aws.accessKey = newConfig.aws.accessKey;
            this.gameConfig.aws.secretKey = newConfig.aws.secretKey;
            this.gameConfig.aws.accountId = newConfig.aws.accountId;
            this.gameConfig.aws.userName = newConfig.aws.userName;
            this.gameConfig.aws.password = newConfig.aws.password;
            // this.gameConfig.lambda.checkTask = newConfig.lambda.checkTask;
            // this.gameConfig.storage.scoresBucket = newConfig.storage.scoresBucket;
        },
        loadConfig: async function() {
            this.loading = true;
            let s = document.createElement("script");
            s.type = "text/javascript";
            s.src = "configs/" + this.configFile;
            let self = this;
            s.onload = () => {
                if (!Config) {
                    self.statusMessage = "Invalid config file";
                    self.initialization.valid = false;
                    self.loading = false;
                    return;
                }
                self.setConfig(Config)
                self.statusMessage = "Config loaded";
                self.initialization.valid = true;
                self.loading = false;
            }
            s.onerror = () => {
                self.statusMessage = "Bad login";
                self.initialization.valid = false;
                self.loading = false;
            }
            document.body.append(s);
        },
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
                this.gameConfig.aws = {
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

// Assign to reactive Vue.js properties
function assignAll(source, destination) {
    for (const [key, value] of Object.entries(destination)) {
        source[key] = value;
    }
}