/*
    references the given env variable
*/

import {isJsonObject, resolveAddress} from "../RichJsonHelper.js";
import {__parseRichJsonInMember, __RICH_JSON_COMMAND_PATH_DELIMITER, __RICH_JSON_KEY_COMMAND_MEMBER} from "../RichJson.js";
import {__executeRefCommand} from "./RichJson_ref.js";
import {__RICH_JSON_ENVIRONMENT, addEnvironmentVariables} from "../RichJsonEnvironment.js";



export function __executeEnvCommand(parser, context) {
    if (isJsonObject(context.currentMember)) {
        addEnvironmentVariables(context.currentMember);
        return context.currentMember;
    }

    let ref = context.currentMember.split(__RICH_JSON_COMMAND_PATH_DELIMITER, 2);
    let firstRef = ref[0];

    if (Object.hasOwn(__RICH_JSON_ENVIRONMENT, firstRef)) {
        context.currentMember = __RICH_JSON_ENVIRONMENT[firstRef];
        context.root = isJsonObject(context.currentMember) ? context.currentMember : {};
        context.currentAddress = resolveAddress(context.root);
        context.currentMember = parser.__parseRichJsonInMember();
        __RICH_JSON_ENVIRONMENT[firstRef] = context.currentMember;
        if (ref.length === 2) {
            context.currentMember = ref[1];
            context.currentMember = __executeRefCommand();
        }
        return context.currentMember;
    } else {
        throw (`Environment variable '{_member}' does not exist.`);
    }
}


