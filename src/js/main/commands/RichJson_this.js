/*
    references the given member on self
*/

import {__executeRefCommand} from "./RichJson_ref.js";

export function __executeThisCommand(root, current, currentCommand, currentMember, currentAddress, currentName) {
    return __executeRefCommand(root, current, currentCommand, currentMember, currentAddress, currentName);
}