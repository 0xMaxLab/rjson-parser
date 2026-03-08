import {cloneObject} from "./RichJsonHelper";
import {__RICH_JSON_KEY_COMMAND_MEMBER} from "./RichJson";

/**
 * Make key commands constant for given JSON object.
 * @param jsonObject
 * @returns {{}}
 */
export function keepKeyCommands(jsonObject) {
    if (Object.hasOwn(jsonObject, __RICH_JSON_KEY_COMMAND_MEMBER)) {
        jsonObject[__RICH_JSON_KEY_COMMAND_MEMBER] = cloneObject(jsonObject[__RICH_JSON_KEY_COMMAND_MEMBER]);
    }
    return jsonObject;
}