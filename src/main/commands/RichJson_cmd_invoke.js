/*
    invoked the given member
*/

export function __executeInvokeCommand(root, current, currentCommand, currentMember, currentAddress, currentName) {
    return currentMember();
}