import {RichJsonParser} from "./RichJson.js";
import {__RICH_JSON_CONFIG} from "../other/RichJsonConfiguration.js";

/**
 * Parses RichJson expressions in JSON object.
 * @param object
 * @returns object
 */
export function parse(object) {
    if (__RICH_JSON_CONFIG.logEnabled) {
        console.log(`RichJson is going to be applied...`);
    }

    return new RichJsonParser().parse(object, true);
}