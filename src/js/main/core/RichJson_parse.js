import {RichJsonParser} from "./RichJson.js";
import {__RICH_JSON_CONFIG} from "../other/RichJsonConfiguration.js";

/**
 * Parses RichJSON expressions in JSON object.
 * @param object
 * @returns object
 */
export function parse(object) {
    return new RichJsonParser().parse(object, true);
}