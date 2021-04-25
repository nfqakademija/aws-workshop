Vue.component('secret', {
    template: `
    <div>
        <h5>Access by credentials and roles (context)</h5>
        <div class="row">
            <div class="col s6">
                <div class="card horizontal">
                    <div class="card-stacked">
                        <div class="card-content">
                            <slot></slot>
                        </div>
                        <div class="card-action">
                            <button v-on:click="getSecret" class="btn waves-effect waves-light" type="button">Get secret<i class="material-icons right">send</i></button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col s6">{{ statusMessage }}</div>
        </div>
        <div class="row">
            <div class="col s6">
                <div class="card horizontal">
                    <div class="card-stacked">
                        <div class="card-content">
                            Try running this in EC2 instance
                        </div>
                        <div class="card-action">
                            <code>aws --region=eu-west-1 secretsmanager get-secret-value --secret-id {{secretArn}}</code>                            
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <hints>
                    <hint v-bind:name="'AWS SDK use environment variables to login'">
                        <h5>Tip</h5>
                        EC2 instances have assigned InstanceProfiles (groups of roles).<br/>
                        AWS SDK (and CLI tools) checks environment variables, if no explicit config is provided.<br/>
                        Resulting in separation for dev/staging and production setup.<br/>
                        Because permissions are based on context (role, environment variables, temporal credentials),
                        and not hardcoded login values<br/>  
                        On <code>spaceship-production</code> instance,
                        <i>aws secretsmanager ...</i> command should return result.
                        <h5>More information</h5>
                        <div class="collection">
                            <a class="collection-item" href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html">IAM roles</a>
                            <a class="collection-item" href="https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html">AWS CLI configrued via environment variables</a>
                            <a class="collection-item" href="https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html">AWS Secrets Manager</a>
                        </div>
                    </hint>
                </hints>
            </div>
        </div>
    </div>`,
    props: {
        secretArn: {
            type: String,
            required: true
        },
    },
    data: function () {
        return {
            loading: false,
            statusMessage: "",
        }
    },
    methods: {
        getSecret: async function () {
            this.$parent.configureAws();

            this.loading = true;
            try {
                let secretsManager = new AWS.SecretsManager();
                let result = await secretsManager.getSecretValue({SecretId: this.secretArn}).promise();
                this.statusMessage = "Result:\n" + JSON.stringify(result, null, 2)
            } catch (error) {
                this.statusMessage = 'ERROR: ' + error;
            }
            this.loading = false;
        }
    }
})