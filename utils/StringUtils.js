// Format string for markdown parse mode - escape any special characters with backslashes
export function formatString(str) {
    const specialCharacters = ['_', '-', '.', '!', '(', ')', '[', ']'];
    // for(const char of specialCharacters) {
    //     str = str.replaceAll(new RegExp(char, 'g'), `\\${char}`)
    // }
    return str
    .replace(/\_/g, "\\_")
    .replace(/\-/g, "\\-")
    .replace(/\./g, "\\.")
    .replace(/\!/g, "\\!")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]");
}

// Format datetime to string
export function formatDatetime(datetime) {
    return `${datetime.getFullYear()}-${(datetime.getMonth()+1).toString().padStart(2, '0')}-${datetime.getDate().toString().padStart(2, '0')} ${datetime.getHours().toString().padStart(2, '0')}:${datetime.getMinutes().toString().padStart(2, '0')}`
}