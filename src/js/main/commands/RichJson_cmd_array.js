/*
    makes a deep copy of the given struct
*/

export function __executeArrayCommand(root, current, currentCommand, currentMember, currentAddress, currentName) {
    let rv = [];
    for (var i = 0, len = Object.keys(currentMember).length - 1; i < len; ++i) {
        rv[i] = currentMember[i];
    }
    return rv;
}
