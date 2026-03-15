import {__RICH_JSON_KEY_COMMAND_MEMBER} from "./RichJson.js";

export const __RICH_JSON_ENVIRONMENT = {}

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
    if (Object.hasOwn(__RICH_JSON_ENVIRONMENT, name)) {
        throw (`RichJson has the macro '${name}' already defined`);
    }

    __RICH_JSON_ENVIRONMENT[name] = value;
}