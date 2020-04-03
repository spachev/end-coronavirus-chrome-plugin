function extract_auth_code()
{
	return find_value_in_xpath("//div/textarea");
}

function handle_onload()
{
	console.log("in handle onload", document.location.href);
	if (!is_oauth_url(document.location.href))
		return;

	let code = extract_auth_code();
	console.log("in handle onload, code", code);

	if (!code)
		return;

	chrome.runtime.sendMessage({action: "register_auth_code", code: code});
}

chrome.runtime.onMessage.addListener(
	function (msg, sender, cb) {
		switch (msg.action)
		{
			case "onload":
				handle_onload();
				break;
		}
	}
);
