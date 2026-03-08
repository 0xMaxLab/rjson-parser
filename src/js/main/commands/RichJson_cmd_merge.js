/*
    joins two structs or arrays together
*/

import {concatArrays, getFieldByKey, isJsonObject, mergeIntoTarget} from "../RichJsonHelper";
import {__executeRefCommand} from "./RichJson_cmd_ref";
import {__RICH_JSON_CIRCULAR_CACHE, __RICH_JSON_COMMAND_DELIMITER} from "../RichJson";

export function __executeMergeCommand(root, current, currentCommand, currentMember, currentAddress, currentName) {
    currentMember = currentMember.split(__RICH_JSON_COMMAND_DELIMITER);
    let struct_or_array = getFieldByKey(__RICH_JSON_CIRCULAR_CACHE.stack, currentAddress);
    let member = __executeRefCommand(root, current, currentCommand, currentMember[0].trim(), currentAddress, currentName);

    if (isJsonObject(member)) {
        mergeIntoTarget(struct_or_array, member);
        for (let i = 1; i < currentMember.length; ++i) {
            member = __executeRefCommand(root, current, currentCommand, currentMember[i].trim(), currentAddress, currentName);
            mergeIntoTarget(struct_or_array, member);
        }
    } else {
        struct_or_array = member;
        __RICH_JSON_CIRCULAR_CACHE.stack[currentAddress] = struct_or_array; // TODO look ahead for array or object in __resolveRichJsonInMember
        for (let i = 1; i < currentMember.length; ++i) {
            member = __executeRefCommand(root, current, currentCommand, currentMember[i].trim(), currentAddress, currentName);
            struct_or_array = concatArrays(struct_or_array, member);
            __RICH_JSON_CIRCULAR_CACHE.stack[currentAddress] = struct_or_array; // concat creates a new array
        }
    }

    return struct_or_array;
}