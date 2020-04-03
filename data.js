class Data
{
	constructor()
	{
		// hard code for now,
		// TODO: read from options
		this.key_col = "B1:B";
		this.val_col = "G";
		this.url = null;
		this.key = null;
		this.val = null;
	}

	get_lc_key()
	{
		if (typeof this.key !== "string")
			return this.key;

		return this.key.trim().toLowerCase();
	}
}
