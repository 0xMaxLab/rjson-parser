import {__RICH_JSON_KEY_COMMAND_MEMBER} from "../core/RichJson.js";
import {__RICH_JSON_CONFIG} from "./RichJsonConfiguration.js";

export const __RICH_JSON_ENVIRONMENT = {}

/**
 * Adds constants to the environment.
 * @param envs
 */
export function addEnvironmentVariables(envs) {
    let names = Object.keys(envs);
    let name = undefined;

    for (let i = 0; i < names.length; ++i) {
        name = names[i];
        addEnvironmentVariable(name, envs[name])
    }
}

/**
 * Adds a constant to the environment.
 * @param name
 * @param value
 */
export function addEnvironmentVariable(name, value) {
    if (name === __RICH_JSON_KEY_COMMAND_MEMBER) {
        return;
    }
    if (Object.hasOwn(__RICH_JSON_ENVIRONMENT, name)) {
        if (__RICH_JSON_CONFIG.infoEnabled) {
            console.warn(`RichJson has the evn variable '${name}' already defined`);
        }
    } else {
        __RICH_JSON_ENVIRONMENT[name] = value;
    }
}