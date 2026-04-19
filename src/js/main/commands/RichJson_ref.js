/*
    references the given member's value (any)
*/

import {isJsonObject} from "../helper/RichJsonHelper.js";
import {__RICH_JSON_COMMAND_PATH_DELIMITER} from "../core/RichJson.js";

export function __executeRefCommand(parser, context) {
    if (context.currentMember === "") {
        return context.root;
    }
    let prevMember = context.root;
    let currentAddress = context.currentAddress;
    let refs = context.currentMember.split(__RICH_JSON_COMMAND_PATH_DELIMITER);
    let ref = undefined;

    for (let i = 0; i < refs.length; ++i) {
        ref = refs[i];
        context.currentName = ref;
        if (isJsonObject(prevMember)) {
            if (Object.hasOwn(prevMember, ref)) {
                context.currentMember = prevMember[ref];
            } else {
                throw (`Member '${ref}' in '${parser.cache.resolveAddress(prevMember)}' does not exist`);
            }
        }
        context.currentAddress = isJsonObject(context.currentMember) || Array.isArray(context.currentMember)
            ? parser.cache.resolveAddress(context.currentMember)
            : parser.cache.resolveAddress(prevMember) + "_" + ref
        ;
        context.currentMember = parser.__parseRichJsonInMember();
        context.currentPath.push(ref);
        prevMember = context.currentMember;
    }
    context.currentAddress = currentAddress;
    context.currentPath.splice(context.currentPath.length - refs.length, context.currentPath.length);
    return context.currentMember;
}