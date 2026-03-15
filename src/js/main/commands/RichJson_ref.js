/*
    references the given member's value (any)
*/

import {concatStrings, isJsonObject, resolveAddress} from "../RichJsonHelper";
import {__parseRichJsonInMember, __RICH_JSON_COMMAND_PATH_DELIMITER} from "../RichJson";

export function __executeRefCommand(root, current, currentCommand, currentMember, currentAddress, currentName) {
    if (currentMember === "") {
        return root;
    }
    let prevMember = root;
    let member = undefined;
    let ref = undefined;
    let address = undefined;

    currentMember = currentMember.split(__RICH_JSON_COMMAND_PATH_DELIMITER);
    for (let i = 0; i < currentMember.length; ++i) {
        ref = currentMember[i];
        if (isJsonObject(prevMember)) {
            if (Object.hasOwn(prevMember, ref)) {
                member = prevMember[ref];
            } else {
                throw (`Member '${ref}' in '${resolveAddress(prevMember)}' does not exist`);
            }
        }
        address = isJsonObject(member) || Array.isArray(member)
            ? resolveAddress(member)
            : concatStrings(resolveAddress(prevMember), "_", ref)
        ;
        member = __parseRichJsonInMember(root, current, member, address, currentName);
        prevMember = member;
    }

    return member;
}