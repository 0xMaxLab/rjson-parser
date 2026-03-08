/*
    makes a deep copy of the given struct
*/

import {__RICH_JSON_CLONE_IS_APPLYING} from "../RichJson";
import {cloneObject} from "../RichJsonHelper";
import {DEBUG_LOG_RICH_JSON, RICH_JSON_CRASH_ON_NESTED_CLONE} from "../RichJsonConfiguration";

export let __RICH_JSON_CLONE_ADDRESS = undefined

export function __executeCloneCommand(root, current, currentCommand, currentMember, currentAddress, currentName) {
    if (RICH_JSON_CRASH_ON_NESTED_CLONE && __RICH_JSON_CLONE_IS_APPLYING()) {
        throw (`RichJson nested clone detected in '${currentAddress}'.`);
    }
    __RICH_JSON_CLONE_ADDRESS = currentAddress;
    currentMember = cloneObject(currentMember);
    if (DEBUG_LOG_RICH_JSON) {
        console.debug(`RichJson resolved clone in '${currentAddress}'.`);
    }
    return currentMember;
}
