import fs from 'fs';
import {concatStrings, mergeIntoTarget} from "./RichJsonHelper.js";
import {parse} from "./RichJson_parse.js";
import * as PATH from 'node:path';
import {__RICH_JSON_CONFIG} from "./RichJsonConfiguration.js";

const FILE_CACHE = {};

/**
 * Reads a directory like a JSON file and resolves RichJson.
 * @param path
 * @returns {{}}
 */
export function readDirectory(path) {
    let entries = fs.readdirSync(path, {withFileTypes: true});
    let rv = {};
    defaultNodeReader
    entries.forEach(entry => {
        if (entry.isFile()) {
            let nameWithoutExtension = PATH.parse(entry.name).name;
            rv[nameWithoutExtension] = readFile(concatStrings(path, "/", entry.name));
        } else if (entry.isDirectory()) {
            rv[entry.name] = readDirectory(concatStrings(path, "/", entry.name));
        }
    });

    return rv;
}

/**
 * Reads a JSON file and resolves RichJson if contained.
 * @param path
 * @returns {*|string}
 */
export function readFile(path) {
    if (__RICH_JSON_CONFIG.fileCacheEnabled && Object.hasOwn(FILE_CACHE, path)) {
        return FILE_CACHE[path];
    }

    if (__RICH_JSON_CONFIG.fileCacheEnabled) FILE_CACHE[path] = {};
    let rv = JSON.parse(fs.readFileSync(path, 'utf-8'));
    rv = parse(rv);
    if (__RICH_JSON_CONFIG.fileCacheEnabled) FILE_CACHE[path] = mergeIntoTarget(FILE_CACHE[path], rv);

    return rv;
}