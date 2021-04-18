Vue.component('question', {
    template: `
    <div class="col s12 m7">
        <div class="card horizontal">
            <div class="card-stacked">
                <div class="card-content">
                    <slot></slot>
                </div>
                <div class="card-action">
                    <button v-on:click="send('no')" class="btn waves-effect waves-light brown" type="button">No</button>
                    <button v-on:click="send(value)" class="btn waves-effect waves-light" type="button">Yes
                        <i class="material-icons right">send</i>
                    </button>
                </div>
                <div>{{ statusMessage }}</div>
            </div>
        </div>
    </div>`,
    props: {
        player: {
            type: String,
            required: true
        },
        task: {
            type: String,
            required: true
        },
        value: {
            type: String,
            required: true
        }
    },
    data: function () {
        return {
            loading: false,
            statusMessage: "",
        }
    },
    methods: {
        send: async function (value) {
            this.$parent.configureAws();

            this.loading = true;
            try {
                var lambda = new AWS.Lambda();
                let payload = JSON.stringify({
                    "task": this.task,
                    "value": value
                });
                let result = await lambda.invoke({
                    FunctionName: Config.lambda.checkTask,
                    Payload: payload,
                    ClientContext: btoa(JSON.stringify({ "player": this.player }))
                }).promise();
                this.statusMessage = "Status: " + result.StatusCode + "\n" + JSON.stringify(JSON.parse(result.Payload), null, 2);
            } catch (error) {
                this.statusMessage = 'ERROR: ' + error;
            }
            this.loading = false;
        }
    }
})