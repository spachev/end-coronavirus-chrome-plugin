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
			let contexts = f.includes("mark") ? ["selection"] : ["page"];
			chrome.contextMenus.create({"title" : this.get_title(f),
				"onclick" : (info,tab) => {self[f].call(self, info, tab);}, "contexts" : contexts});
		}
	}

	handle_refresh_access_token(info, tab)
	{
		this.sheets_cli.refresh_access_token();
	}

	process_selection(info, tab, cb)
	{
		let get_selection_js = "function get_selection(wnd) { " +
			 " let result = wnd.getSelection(); " +
			 "for (let i = 0; (!result || !result.toString()) && i <  wnd.frames.length; i++) " +
			 "result = get_selection(wnd.frames[i]); " +
			 "return result; }\n";

		chrome.tabs.executeScript(tab.id, {code: get_selection_js + "get_selection(window).toString()"}, (sel_arr) => {
			if (!sel_arr[0])
				return;
			console.log("selection", sel_arr[0]);
			cb(sel_arr[0]);
			chrome.tabs.executeScript(tab.id, {code: get_selection_js + "get_selection(window).empty()"});
		});
	}

	// keep handle_mark functions in this order so they will appear in the menu
	// in that order
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

	handle_prev_value_column(info, tab)
	{
		this.sheets_cli.shift_val_col(-1);
	}

	handle_next_value_column(info, tab)
	{
		this.sheets_cli.shift_val_col(1);
	}

	/*
	handle_mark_key_column(info, tab)
	{
		this.process_selection(info, tab, (v) => {
			this.sheets_cli.set_sheet_by_url(tab.url,
				() => this.sheets_cli.set_key_col_by_header(v,
					() => this.sheets_cli.notify("Key column set to " + this.sheets_cli.key_col )));
		}
	}

	handle_mark_value_column(info, tab)
	{
		this.process_selection(info, tab, (v) => {
			this.sheets_cli.set_sheet_by_url(tab.url,
				() => this.sheets_cli.set_val_col_by_header(v,
					() => this.sheets_cli.notify("Value column set to " + this.sheets_cli.val_col)));
		}
	}
	*/

	get_title(f)
	{
		let parts = f.split('_');

		if (parts.length < 1)
			return "";

		parts.shift();
		return ucwords(parts.join(" "));
	}
}
