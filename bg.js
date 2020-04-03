function install_bg_listener()
{
	chrome.runtime.onMessage.addListener(
		(req, sender, send_rsp) => {
			switch (req.action)
			{
				case "register_auth_code":
					menu.sheets_cli.set_code(req.code);
					//console.log("sender", sender);
					chrome.tabs.remove(sender.tab.id);
					break;
			}
		}
	);
}

function handle_onload(tab)
{
	chrome.tabs.sendMessage(tab.id, {'action' : 'onload'});
}

function should_notify_onload(tab)
{
	// for now
	return is_oauth_url(tab.url);
}

function install_onload_listener()
{
	chrome.tabs.onUpdated.addListener( function (tab_id, change_info, tab) {
			if (change_info.status == 'complete') {
				console.log("loaded tab:", tab, "tab id", tab_id);
				if (should_notify_onload(tab))
					handle_onload(tab);
			}
	});
}

function install_command_listener()
{
	chrome.commands.onCommand.addListener((cmd) => {
		console.log('Command:', cmd);
		chrome.tabs.query({active:true}, (tabs) => {
			switch (cmd)
			{
				case "mark-key":
					menu.handle_mark_key(null, tabs[0]);
					break;
				case "mark-value":
					menu.handle_mark_value(null, tabs[0]);
					break;
			}
		});
	});
}

install_bg_listener();
install_onload_listener();
install_command_listener();

let menu = new Menu(new Data(), new Sheets_client());
menu.sheets_cli.init();
