import {RichJsonParser} from "./RichJson.js";
import {__RICH_JSON_CONFIG} from "../other/RichJsonConfiguration.js";

/**
 * Parses RichJSON expressions in JSON object.
 * @param object
 * @returns object
 */
export function parse(object) {
    const parser = new RichJsonParser();

    if (__RICH_JSON_CONFIG.logEnabled || __RICH_JSON_CONFIG.debugEnabled) {
        console.group(`${parser.label} is going to be applied...`);
        if (__RICH_JSON_CONFIG.debugEnabled) {
            console.time(parser.label);
        }
    }

    return parser.parse(object, true);
}