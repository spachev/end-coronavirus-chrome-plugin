	new Vue({
		el: '#app',
		vuetify: new Vuetify(),
		data: {
			info: {
				sheet_id: "",
				key_column: "",
				value_column: ""
			}
		},
		methods: {
			get_label(f) {
				return ucwords(f.replace("_", " "));
			},
			save() {
				let vm = this;
				chrome.storage.sync.set(this.info, () => {
					vm.close();
				});
			},
			close() {
				window.close();
			}
		},
		mounted() {
			chrome.storage.sync.get(Object.keys(this.info), (store_opts) => {
				for (let k of Object.keys(this.info))
				{
					let val = store_opts[k];
					if (typeof val === "undefined")
						val = "";
					this.info[k] = val;
				}
			});
		},
		computed: {
			fields() {
				return Object.keys(this.info);
			}
		}
	})
