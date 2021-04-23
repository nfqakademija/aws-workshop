Vue.component('hints', {
    template: `
    <div class="col s12 m6 hints collapsible">
        <div class="switch">
            <label>
                  Hints:
                  <input type="checkbox" v-model="show"/>
                  <span class="lever"></span>
            </label>
        </div>
        <div v-if="show">
            <slot></slot>
        </div>
    </div>`,
    data: function () {
        return {
            show: false,
        }
    },

})