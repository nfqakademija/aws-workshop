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
    },
    methods: {
        login: async function (event) {
            // Configure AWS SDK
            AWS.config.setPromisesDependency(Promise);
            AWS.config.update({
                region: this.region,
                credentials: new AWS.Credentials({
                    accessKeyId: this.accessKey.trim(),
                    secretAccessKey: this.secretKey.trim(),
                })
            });

            // Trying to login
            try {
                this.loading = true;            
                let sts = new AWS.STS();
                let result = await sts.getCallerIdentity({}).promise();
                this.statusMessage = "Logged in as:\n" + JSON.stringify(result, null, 2);
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
    }
});
