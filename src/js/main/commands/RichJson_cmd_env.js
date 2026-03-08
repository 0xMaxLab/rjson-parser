/*
    references the given env variable
*/

import {isJsonObject, resolveAddress} from "../RichJsonHelper";
import {__parseRichJsonInMember, __RICH_JSON_COMMAND_PATH_DELIMITER, __RICH_JSON_KEY_COMMAND_MEMBER} from "../RichJson";
import {__executeRefCommand} from "./RichJson_cmd_ref";

const env = {}

export function __executeEnvCommand(root, current, currentCommand, currentMember, currentAddress, currentName) {
    if (isJsonObject(currentMember)) {
        addRichJsonEnvs(currentMember);
        return currentMember;
    }

    let ref = currentMember.split(__RICH_JSON_COMMAND_PATH_DELIMITER, 2);
    let firstRef = ref[0];
    let address = undefined;

    if (Object.hasOwn(env, firstRef)) {
        currentMember = env[firstRef];
        root = isJsonObject(currentMember) ? currentMember : {};
        address = resolveAddress(root);
        currentMember = __parseRichJsonInMember(root, root, currentMember, address, currentName);
        env[firstRef] = currentMember;
        if (ref.length === 2) {
            currentMember = __executeRefCommand(currentMember, currentMember, currentCommand, ref[1], address, currentName);
        }
        return currentMember;
    } else {
        throw (`Environment variable '{_member}' does not exist.`);
    }
}


/**
 * Adds constants to the environment.
 * @param envs
 */
export function addRichJsonEnvs(envs) {
    let names = Object.keys(envs);
    let name = undefined;

    for (let i = 0; i < names.length; ++i) {
        name = names[i];
        addRichJsonEnv(name, envs[name])
    }
}

/**
 * Adds a constant to the environment.
 * @param name
 * @param value
 */
export function addRichJsonEnv(name, value) {
    if (name === __RICH_JSON_KEY_COMMAND_MEMBER) {
        return;
    }
    if (Object.hasOwn(env, name)) {
        throw (`RichJson has the macro '${name}' already defined`);
    }

    env[name] = value;
}