export const minutes = (int) => int * 60 * 1000;

export const hours = (inMinutes) => parseFloat((inMinutes/60.0).toFixed(2));

export function getCommand(str) {
	const trimmed = str.trim();
	if (trimmed.indexOf(' ') === -1)
		return trimmed;
	else
		return trimmed.substr(0, trimmed.indexOf(' '));
}

export function getOptions(str){
	const trimmed = str.trim();
	if (trimmed.indexOf(' ') === -1)
		return null;
	else
		return trimmed.substr(trimmed.indexOf(' ')+1);
}

