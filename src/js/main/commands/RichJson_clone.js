/*
    makes a deep copy of the given struct
*/

import {__RICH_JSON_IS_CLONE_APPLYING} from "../RichJson.js";
import {cloneObject} from "../RichJsonHelper.js";
import {__RICH_JSON_CONFIG} from "../RichJsonConfiguration.js";

export function __executeCloneCommand(parser, context) {
    if (__RICH_JSON_IS_CLONE_APPLYING()) {
        if (__RICH_JSON_CONFIG.crashOnNestedCloneEnabled) {
            throw (`RichJson nested clone detected in '${context.currentAddress}'.`);
        }
        return currentMember;
    }
    parser.__RICH_JSON_CLONE_ADDRESS = context.currentAddress;
    context.currentMember = cloneObject(context.currentMember);
    if (__RICH_JSON_CONFIG.debugEnabled) {
        console.debug(`RichJson resolved clone in '${parser.__RICH_JSON_CLONE_ADDRESS}'.`);
    }
    return context.currentMember;
}
