const EXPIRES_SAFETY = 60;

class Sheets_client
{
	constructor()
	{
		// for now
		this.client_id = "697523537158-697ta1fk86prvhb9ntnf8i3bi02ebe9f.apps.googleusercontent.com";
		this.client_secret = "4ePO6Ly0nJGQ6FUxde-Fsbya";
		this.code = "4/yAHerx0Llg7AGjKwBTVxr140t7F10jS7iy7VLk_IwRoDk--IQD6IHlE";
		this.sheet_id = null;
		this.redirect_uri = "urn:ietf:wg:oauth:2.0:oob";
		this.scope = "https://www.googleapis.com/auth/spreadsheets";
		this.access_token = null;
		this.refresh_token = null;
		this.code = null;
	}

	get_user_oauth_url()
	{
		return this.build_oauth_url(["client_id", "redirect_uri", "scope"], "auth") + "&response_type=code";
	}

	set_code(code)
	{
		this.code = code;
		this.fetch_tokens();
	}

	build_oauth_url(params, path)
	{
		return OAUTH_PREFIX + "/" + path + "?" + this.build_req_payload(params);
	}

	refresh_access_token(cb)
	{
		let payload = this.build_req_payload(["client_id", "client_secret", "refresh_token"]) + "&grant_type=refresh_token";
		let url = this.build_oauth_url([], "token");
		let self = this;

		$.ajax({
			url: url,
			data: payload,
			type: 'post',
			success: (rsp) => {
				console.log("token refreshed", rsp);
				self.access_token = rsp.access_token;
				self.access_token_expires_ts = date_add(new Date(), rsp.expires_in - EXPIRES_SAFETY);
				cb();
			},
			error: (err) => {
				this.notify("Error refreshing access token");
			}
		});
	}

	build_req_payload(params)
	{
		let self = this;
		return params.map(el => el + "=" + encodeURIComponent(self[el])).join('&');
	}

	fmt_key_col(col)
	{
		col = col.trim();
		if (col.includes(":"))
			return col;
		return col + "1:" + col;
	}

	update_key_val()
	{
		chrome.storage.sync.get(["sheet_id", "key_column", "value_column"], (opts) => {
			this.sheet_id = opts.sheet_id;
			this.key_col = this.fmt_key_col(opts.key_column);
			this.val_col = opts.value_column;
			this.update_key_val_low();
		});
	}

	shift_val_col(offset)
	{
		get_option("value_column", (val_col) => {
				if (!val_col)
				{
					this.notify("Value column is not set");
					return;
				}
				let new_col = col_name_add(val_col, offset);
				update_option("value_column", new_col , () => {
					this.val_col = new_col;
					this.notify("New value column is " + new_col);
				});
			}
		);
	}

	set_sheet_by_url(url, cb)
	{

	}

	update_key_val_low()
	{
		// TODO: can we lock the sheet for the operation?
		this.fetch_column(this.key_col, (keys) => {
			let lc_keys = keys.map(el => typeof el === "string" ? el.trim().toLowerCase() : el);
			let pos = lc_keys.indexOf(this.data.get_lc_key());
			if (pos < 0)
			{
				this.notify("Key " + this.data.key + " not found in column " + this.data.key_col);
				return;
			}

			let col_ref = this.val_col + (pos + 1).toString();
			let parsed_val = this.data.val;
			// TODO: parse depending on the type selection
			let d = strtotime(parsed_val);

			if (d)
				parsed_val = (d.getMonth() + 1).toString() + "/" + d.getDate() + "/" + (d.getYear() + 1900).toString();

			let val = "=hyperlink(\"" + this.data.url + "\",\"" + parsed_val + "\")";
			this.set_col_val(col_ref, val, (rsp) => {
			}, (err) => { this.notify("Error setting " + col_ref + " to " + parsed_val);});
		});
	}

	set_col_val(col, val, cb, cb_err)
	{
		let url = this.get_sheet_url() + "/" + col + "?valueInputOption=USER_ENTERED";
		this.request(url, 'put', {range: col, values: [[val]]}, (rsp) => {
				cb(rsp);
			}, (err) => {
				cb_err(err);
			}
		);
	}

	notify(msg)
	{
		// for now
		alert(msg);
	}

	fetch_tokens()
	{
		let url = this.build_oauth_url([], "token") ;
		$.ajax({
			type: 'post',
			url: url,
			data: this.build_req_payload(["client_id", "client_secret", "redirect_uri", "code"]) +
				"&grant_type=authorization_code",
			success: (rsp) => {
				if (!rsp)
					return;
				this.access_token = rsp.access_token;
				this.refresh_token = rsp.refresh_token;
				this.access_token_expires_ts = date_add(new Date(), rsp.expires_in - EXPIRES_SAFETY);
				this.notify("Authentication successful, ready to extract data");
			},
			error: (err) => {console.log("error got", err);}
		});
	}

	setup_access_token()
	{
		chrome.tabs.create({url: this.get_user_oauth_url()});
	}

	init()
	{
		this.setup_access_token();
	}

	fetch_column(col_name, cb)
	{
		let url = this.get_sheet_url() + "/" + col_name;
		this.request(url, 'get', null, (rsp) => {
				cb(rsp.values.map(el => el[0]));
			}, (err) => {
				console.log("error fetching " + col_name, err);
				this.notify("Could not fetch column " + col_name);
			}
		);
	}

	get_sheet_url()
	{
		return SHEETS_PREFIX + "/" + this.sheet_id + "/values";
	}

	request(url, type, data, cb, err_cb = null)
	{
		let req = {
				url: url,
				headers: {'authorization' : 'Bearer ' + this.access_token},
				success: function (rsp) {
					cb(rsp);
				},
				error: function (err) {
					console.log("Error in AJAX call:", err);
					if (err_cb)
						err_cb(err);
				}
		}
		if (type === "post" || type === "put")
			Object.assign(req, {
				type: type,
				data: JSON.stringify(data),
				contentType: 'application/json',
				dataType: 'json',
			});

		if (new Date() < this.access_token_expires_ts)
		{
			$.ajax(req);
			return;
		}

		this.refresh_access_token(() => $.ajax(req));
	}

}
