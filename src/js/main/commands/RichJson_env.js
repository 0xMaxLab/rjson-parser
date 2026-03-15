/*
    references the given env variable
*/

import {isJsonObject, resolveAddress} from "../RichJsonHelper";
import {__parseRichJsonInMember, __RICH_JSON_COMMAND_PATH_DELIMITER, __RICH_JSON_KEY_COMMAND_MEMBER} from "../RichJson";
import {__executeRefCommand} from "./RichJson_ref";
import {__RICH_JSON_ENVIRONMENT, addRichJsonEnvs} from "../RichJsonEnvironment";



export function __executeEnvCommand(root, current, currentCommand, currentMember, currentAddress, currentName) {
    if (isJsonObject(currentMember)) {
        addRichJsonEnvs(currentMember);
        return currentMember;
    }

    let ref = currentMember.split(__RICH_JSON_COMMAND_PATH_DELIMITER, 2);
    let firstRef = ref[0];
    let address = undefined;

    if (Object.hasOwn(__RICH_JSON_ENVIRONMENT, firstRef)) {
        currentMember = __RICH_JSON_ENVIRONMENT[firstRef];
        root = isJsonObject(currentMember) ? currentMember : {};
        address = resolveAddress(root);
        currentMember = __parseRichJsonInMember(root, root, currentMember, address, currentName);
        __RICH_JSON_ENVIRONMENT[firstRef] = currentMember;
        if (ref.length === 2) {
            currentMember = __executeRefCommand(currentMember, currentMember, currentCommand, ref[1], address, currentName);
        }
        return currentMember;
    } else {
        throw (`Environment variable '{_member}' does not exist.`);
    }
}


