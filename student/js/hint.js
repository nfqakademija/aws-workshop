Vue.component('hint', {
    template: `
    <div class="hint">
        <div class="collapsible-header switch">
            <label>
                <i class="material-icons prefix">textsms</i>
                  <input type="checkbox" v-model="show"/>
                  <span class="lever"></span>
                {{name}}
            </label>
        </div>
        <div class="collapsible-body" v-bind:style="show ? 'display: block;' : ''">
            <slot></slot>
        </div>
    </div>`,
    data: function () {
        return {
            show: false,
        }
    },
    props: {
        name: {
            type: String,
            required: true
        }
    }

})