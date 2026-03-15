/*
    makes a deep copy of the given struct or array
*/

import {cloneObject} from "../RichJsonHelper";
import {__executeRefCommand} from "./RichJson_ref";

export function __executeCopyCommand(root, current, currentCommand, currentMember, currentAddress, currentName) {
    return cloneObject(__executeRefCommand(root, current, currentCommand, currentMember, currentAddress, currentName));
}