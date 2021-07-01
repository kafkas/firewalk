export function getLexicographicallyNextString(str: string): string {
  if (str == '') return 'a';

  let i = str.length - 1;

  while (str[i] == 'z' && i >= 0) {
    i--;
  }

  if (i === -1) {
    str = str + 'a';
  } else {
    str = str.substring(0, i) + String.fromCharCode(str.charCodeAt(i) + 1) + str.substring(i + 1);
  }

  return str;
}
