/*
    makes a deep copy of the given struct
*/

import {cloneObject} from "../helper/RichJsonHelper.js";
import {__RICH_JSON_CONFIG} from "../other/RichJsonConfiguration.js";
import {__RICH_JSON_COMMAND_PATH_DELIMITER} from "../core/RichJson.js";

export function __executeCloneCommand(parser, context) {
    if (parser.__isCloneApplying()) {
        if (__RICH_JSON_CONFIG.crashOnNestedCloneEnabled) {
            throw (`${parser.label} nested clone detected at '${context.currentPath.join(__RICH_JSON_COMMAND_PATH_DELIMITER)}'.`);
        }
        return currentMember;
    }
    parser.cache.cloneAddress = context.currentAddress;
    context.currentMember = cloneObject(context.currentMember);
    if (__RICH_JSON_CONFIG.debugEnabled) {
        console.debug(`${parser.label} resolved clone at '${context.currentPath.join(__RICH_JSON_COMMAND_PATH_DELIMITER)}'.`);
    }
    return context.currentMember;
}
