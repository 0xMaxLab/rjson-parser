/*
    references the given member's value (any)
*/

import {concatStrings, isJsonObject, resolveAddress} from "../RichJsonHelper.js";
import {__parseRichJsonInMember, __RICH_JSON_COMMAND_PATH_DELIMITER} from "../RichJson.js";

export function __executeRefCommand(parser, context) {
    console.log(context);
    if (context.currentMember === "") {
        return context.root;
    }
    let prevMember = context.root;
    let refs = context.currentMember.split(__RICH_JSON_COMMAND_PATH_DELIMITER);
    let ref = undefined;

    for (let i = 0; i < refs.length; ++i) {
        ref = refs[i];
        if (isJsonObject(prevMember)) {
            if (Object.hasOwn(prevMember, ref)) {
                context.currentMember = prevMember[ref];
            } else {
                throw (`Member '${ref}' in '${resolveAddress(prevMember)}' does not exist`);
            }
        }
        context.currentAddress = isJsonObject(context.currentMember) || Array.isArray(context.currentMember)
            ? resolveAddress(context.currentMember)
            : concatStrings(resolveAddress(prevMember), "_", ref)
        ;
        context.currentMember = parser.__parseRichJsonInMember();
        prevMember = context.currentMember;
    }
    console.log(context);
    return context.currentMember;
}