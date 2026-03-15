/*
    makes a deep copy of the given struct
*/

import {__RICH_JSON_IS_CLONE_APPLYING} from "../RichJson";
import {cloneObject} from "../RichJsonHelper";
import {__RICH_JSON_CONFIG} from "../RichJsonConfiguration";

export let __RICH_JSON_CLONE_ADDRESS = undefined

export function __executeCloneCommand(root, current, currentCommand, currentMember, currentAddress, currentName) {
    if (__RICH_JSON_IS_CLONE_APPLYING()) {
        if (__RICH_JSON_CONFIG.crashOnNestedCloneEnabled) {
            throw (`RichJson nested clone detected in '${currentAddress}'.`);
        }
        return currentMember;
    }
    __RICH_JSON_CLONE_ADDRESS = currentAddress;
    currentMember = cloneObject(currentMember);
    if (__RICH_JSON_CONFIG.debugEnabled) {
        console.debug(`RichJson resolved clone in '${currentAddress}'.`);
    }
    return currentMember;
}
