/*
    makes a deep copy of the given struct
*/

import {cloneObject} from "../RichJsonHelper.js";
import {__RICH_JSON_CONFIG} from "../RichJsonConfiguration.js";

export function __executeCloneCommand(parser, context) {
    if (parser.__isCloneApplying()) {
        if (__RICH_JSON_CONFIG.crashOnNestedCloneEnabled) {
            throw (`RichJson nested clone detected in '${context.currentAddress}'.`);
        }
        return currentMember;
    }
    parser.cache.cloneAddress = context.currentAddress;
    context.currentMember = cloneObject(context.currentMember);
    if (__RICH_JSON_CONFIG.debugEnabled) {
        console.debug(`RichJson resolved clone in '${parser.cache.cloneAddress}'.`);
    }
    return context.currentMember;
}
