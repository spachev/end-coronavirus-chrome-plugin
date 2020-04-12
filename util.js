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

function date_add(d, sec)
{
	return new Date(new Date().getTime() + sec * 1000);
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

function update_option(name, val, cb)
{
	let info = {};
	info[name] = val;
	chrome.storage.sync.set(info, () => cb());
}

function get_option(name, cb)
{
	chrome.storage.sync.get([name], opts => cb(opts[name]));
}


function col_to_letter(column)
{
	let temp, letter = '';
	while (column > 0)
	{
		temp = (column - 1) % 26;
		letter = String.fromCharCode(temp + 65) + letter;
		column = (column - temp - 1) / 26;
	}
	return letter;
}

function letter_to_col(letter)
{
	let column = 0, length = letter.length;
	letter = letter.toUpperCase();
	for (let i = 0; i < length; i++)
	{
		column += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1);
	}
	return column;
}

function col_name_add(col_name, val)
{
	col_name = col_name.toUpperCase();
	let m = col_name.match(/^([A-Z]+)(.*)$/);

	if (!m)
		return col_name;

	let col_num = letter_to_col(m[1]);

	if (col_num + val < 1)
		return col_name;

	return col_to_letter(col_num + val) + m[2];
}
