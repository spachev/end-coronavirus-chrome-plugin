class Menu
{
	constructor(data, sheets_cli)
	{
		this.data = data;
		this.sheets_cli = sheets_cli;
		this.sheets_cli.data = data;
		for (let f of Object.getOwnPropertyNames(Menu.prototype))
		{
			if (!f.startsWith("handle_") || typeof this[f] !== "function")
				continue;

			let self = this;
			chrome.contextMenus.create({"title" : this.get_title(f),
				"onclick" : (info,tab) => {self[f].call(self, info, tab);}, "contexts" : ["selection"]});
		}
	}

	process_selection(info, tab, cb)
	{
		chrome.tabs.executeScript(tab.id, {code: "window.getSelection().toString()"}, (sel_arr) => {
			cb(sel_arr[0]);
			chrome.tabs.executeScript(tab.id, {code: "window.getSelection().empty()"});
		});
	}

	handle_mark_key(info, tab)
	{
		this.process_selection(info, tab, (k) => { this.data.key = k});
	}

	handle_mark_value(info, tab)
	{
		this.process_selection(info, tab, (v) => {
			this.data.val = v;
			this.data.url = tab.url;
			this.sheets_cli.update_key_val();
		});
	}

	get_title(f)
	{
		let parts = f.split('_');

		if (parts.length < 1)
			return "";

		parts.shift();
		return ucwords(parts.join(" "));
	}
}
