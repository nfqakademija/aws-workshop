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
    el: '#spa',
    data: function () {
        return {
            initialization: {
                userName: cache.get('initializationUserName'),
                company: cache.get('initializationUserCompany'),
                valid: true,
                statusMessage: "",
                loading: false,
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
                    maxScore: 20
                },
                students: [],
                "secrets": {
                    "productionSecretsArn": ""
                },
                "costSavingMode": true
            },
            sts: {
                statusMessage: "",
                loading: false,
            }
        };
    },
    computed: {
        configFile: function () {
            // Should be aligned with same logic in workshopUsers.js
            let name = this.initialization.company + '-' + this.initialization.userName;
            name = name.replace(/[^a-z0-9-]/ig, '-').toLowerCase()
            return name + ".js";
        },
        notSecure: function () {
            return location.protocol !== 'https:' && location.protocol !== 'file:'
        }
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
            this.gameConfig = newConfig
        },
        loadConfig: async function() {
            this.initialization.loading = true;
            if (this.notSecure) {
                this.initialization.statusMessage = "Running on not secure connection. Will not expose passwords";
                this.initialization.loading = false;
            }
            let s = document.createElement("script");
            s.type = "text/javascript";
            s.src = "configs/" + this.configFile;
            let self = this;
            s.onload = () => {
                if (!Config) {
                    self.initialization.statusMessage = "Invalid config file";
                    self.initialization.valid = false;
                    self.initialization.loading = false;
                    return;
                }
                self.setConfig(Config)
                cache.set('initializationUserName', self.initialization.userName);
                cache.set('initializationUserCompany', self.initialization.company);
                self.initialization.statusMessage = "Config loaded";
                self.initialization.valid = true;
                self.initialization.loading = false;
            }
            s.onerror = () => {
                self.initialization.statusMessage = "Bad login";
                self.initialization.valid = false;
                self.initialization.loading = false;
            }
            document.body.append(s);
        },
        configureAws: function () {
            AWS.config.setPromisesDependency(Promise);
            AWS.config.update({
                region: this.gameConfig.aws.region,
                credentials: new AWS.Credentials({
                    accessKeyId: this.gameConfig.aws.accessKey.trim(),
                    secretAccessKey: this.gameConfig.aws.secretKey.trim(),
                })
            });
        },
        login: async function (event) {
            // Configure AWS SDK
            this.configureAws();

            // Trying to login
            try {
                this.sts.loading = true;
                let sts = new AWS.STS();
                let result = await sts.getCallerIdentity({}).promise();
                this.sts.statusMessage = "Logged in as:\n" + JSON.stringify(result, null, 2);
                this.sts.loading = false;
            } catch (error) {
                this.sts.statusMessage = 'ERROR: ' + error;
                this.sts.loading = false;
                return;
            }

            // Do not refresh the page
            if (event) {
                event.preventDefault();
                return false;
            }
        },
        copyToClipboard(value) {
            const textarea = document.createElement('textarea')
            textarea.value = value
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'absolute';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select()
            try {
                var successful = document.execCommand('copy');
                console.log('copied')
            } catch(err) {
                console.warn('Failed', err)
            }
            textarea.remove()
        }
    }
});

// Assign to reactive Vue.js properties
function assignAll(source, destination) {
    for (const [key, value] of Object.entries(destination)) {
        source[key] = value;
    }
}