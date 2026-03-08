import fs from 'fs';
import {concatStrings, mergeIntoTarget} from "./RichJsonHelper";
import {parseRichJson} from "./RichJson_parse";
import * as PATH from 'node:path';
import {RICH_JSON_FILE_CACHE_ENABLED} from "./RichJsonConfiguration";

const FILE_CACHE = {};

/**
 * Reads a directory like a JSON file and resolves RichJson.
 * @param path
 * @returns {{}}
 */
export function readRichJsonDirectory(path) {
    let entries = fs.readdirSync(path, { withFileTypes: true });
    let rv = {};

    entries.forEach(entry => {
        if (entry.isFile()) {
            let nameWithoutExtension = PATH.parse(entry.name).name;
            rv[nameWithoutExtension] = readRichJsonFile(concatStrings(path, "/", entry.name));
        } else if (entry.isDirectory()) {
            rv[entry.name] = readRichJsonDirectory(concatStrings(path, "/", entry.name));
        }
    });

    return rv;
}

/**
 * Reads a JSON file and resolves RichJson if contained.
 * @param path
 * @returns {*|string}
 */
export function readRichJsonFile(path) {
    if (RICH_JSON_FILE_CACHE_ENABLED && Object.hasOwn(FILE_CACHE, path)) {
        return FILE_CACHE[path];
    }

    if (RICH_JSON_FILE_CACHE_ENABLED) FILE_CACHE[path] = {};
    let rv = JSON.parse(fs.readFileSync(path, 'utf-8'));
    rv = parseRichJson(rv);
    if (RICH_JSON_FILE_CACHE_ENABLED) FILE_CACHE[path] = mergeIntoTarget(FILE_CACHE[path], rv);

    return rv;
}