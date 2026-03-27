import {RichJsonParser} from "./RichJson.js";
import {__RICH_JSON_CONFIG} from "./RichJsonConfiguration.js";

/**
 * Parses RichJson expressions in JSON object.
 * @param object
 * @returns object
 */
export function parse(object) {
    if (__RICH_JSON_CONFIG.debugEnabled) {
        console.debug(`RichJson is going to be applied due to.`);
    }

    return new RichJsonParser().parse(object, true);
}