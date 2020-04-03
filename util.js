const OAUTH_PREFIX = "https://accounts.google.com/o/oauth2";
const SHEETS_PREFIX = "https://sheets.googleapis.com/v4/spreadsheets";

function ucwords(str)
{
	if (typeof str !== "string")
		return str;

	return str.toLowerCase().replace(/^(.)|\s+(.)/g, function ($1) {
		return $1.toUpperCase()
	});
}

function by_xpath(path)
{
  return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function find_value_in_xpath(path)
{
	let el = by_xpath(path);

	if (!el) return null;

	return el.value;
}

function is_oauth_url(url)
{
	return url.startsWith(OAUTH_PREFIX);
}
