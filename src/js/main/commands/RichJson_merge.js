/*
    joins two structs or arrays together
*/

import {concatArrays, getFieldByKey, isJsonObject, mergeIntoTarget} from "../RichJsonHelper.js";
import {__executeRefCommand} from "./RichJson_ref.js";
import {__RICH_JSON_COMMAND_DELIMITER} from "../RichJson.js";

export function __executeMergeCommand(parser, context) {
    let refs = context.currentMember.split(__RICH_JSON_COMMAND_DELIMITER);
    let struct_or_array = getFieldByKey(parser.cache.stack, context.currentAddress);
    let currentAddress = context.currentAddress;
    context.currentMember = refs[0].trim()
    context.currentMember = __executeRefCommand(parser, context);
    context.currentAddress = currentAddress;

    if (isJsonObject(context.currentMember)) {
        mergeIntoTarget(struct_or_array, context.currentMember);
        for (let i = 1; i < refs.length; ++i) {
            context.currentMember = refs[i].trim();
            context.currentMember = __executeRefCommand(parser, context);
            context.currentAddress = currentAddress;
            mergeIntoTarget(struct_or_array, context.currentMember);
        }
    } else {
        struct_or_array = context.currentMember;
        parser.cache.stack[context.currentAddress] = struct_or_array; // TODO look ahead for array or object in __resolveRichJsonInMember
        for (let i = 1; i < refs.length; ++i) {
            context.currentMember = refs[i].trim();
            context.currentMember = __executeRefCommand(parser, context);
            context.currentAddress = currentAddress;
            struct_or_array = concatArrays(struct_or_array, context.currentMember);
            parser.cache.stack[context.currentAddress] = struct_or_array; // concat creates a new array
        }
    }

    return struct_or_array;
}