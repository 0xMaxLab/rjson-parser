/*
    references the given env variable
*/

import {isJsonObject} from "../helper/RichJsonHelper.js";
import {__RICH_JSON_COMMAND_PATH_DELIMITER} from "../core/RichJson.js";
import {__executeRefCommand} from "./RichJson_ref.js";
import {__RICH_JSON_ENVIRONMENT, addEnvironmentVariables} from "../other/RichJsonEnvironment.js";


export function __executeEnvCommand(parser, context) {
    if (isJsonObject(context.currentMember)) {
        addEnvironmentVariables(context.currentMember);
        return context.currentMember;
    }

    let ref = context.currentMember.split(__RICH_JSON_COMMAND_PATH_DELIMITER, 2);
    let firstRef = ref[0];

    if (Object.hasOwn(__RICH_JSON_ENVIRONMENT, firstRef)) {
        context.currentMember = __RICH_JSON_ENVIRONMENT[firstRef];
        let prevRoot = context.root;
        context.root = isJsonObject(context.currentMember) ? context.currentMember : {};
        context.currentAddress = parser.cache.resolveAddress(context.root);
        context.currentMember = parser.__parseRichJsonInMember();
        __RICH_JSON_ENVIRONMENT[firstRef] = context.currentMember;
        if (ref.length === 2) {
            context.currentMember = ref[1];
            context.currentMember = __executeRefCommand(parser, context);
        }
        context.root = prevRoot;
        return context.currentMember;
    } else {
        throw (`Environment variable or path '${context.currentMember}' does not exist.`);
    }
}


