import fs from 'fs';
import {mergeIntoTarget} from "./RichJsonHelper.js";
import {parse} from "../core/RichJson_parse.js";
import * as PATH from 'node:path';
import {__RICH_JSON_CONFIG} from "../other/RichJsonConfiguration.js";
import {__RICH_JSON_LATE_APPLIES, setCommandEnabled} from "../core/RichJsonCommandHolder.js";

const FILE_CACHE = {};

/**
 * Reads a directory like a JSON file and resolves RichJSON.
 * @param path
 * @param _executeLateApplies = false
 * @returns {{}}
 */
export function readDirectory(path, _executeLateApplies = false) {
    let entries = fs.readdirSync(path, {withFileTypes: true});
    let rv = {};

    if (!_executeLateApplies) {
        __RICH_JSON_LATE_APPLIES.forEach(cmd => setCommandEnabled(cmd, false));
    }

    entries.forEach(entry => {
        if (entry.isFile()) {
            let nameWithoutExtension = PATH.parse(entry.name).name;
            rv[nameWithoutExtension] = readFile(path + "/" + entry.name, true);
        } else if (entry.isDirectory()) {
            rv[entry.name] = readDirectory(path + "/" + entry.name, true);
        }
    });

    if (!_executeLateApplies) {
        __RICH_JSON_LATE_APPLIES.forEach(cmd => setCommandEnabled(cmd, true));
    }

    return rv;
}

/**
 * Reads a JSON file and resolves RichJSON if contained.
 * @param path
 * @param _executeLateApplies = false
 * @returns {*|string}
 */
export function readFile(path, _executeLateApplies = false) {
    if (__RICH_JSON_CONFIG.fileCacheEnabled && Object.hasOwn(FILE_CACHE, path)) {
        return FILE_CACHE[path];
    }

    if (__RICH_JSON_CONFIG.fileCacheEnabled) {
        FILE_CACHE[path] = {};
    }

    if (!_executeLateApplies) {
        __RICH_JSON_LATE_APPLIES.forEach(cmd => setCommandEnabled(cmd, false));
    }

    let rv = JSON.parse(fs.readFileSync(path, 'utf-8'));
    rv = parse(rv);

    if (!_executeLateApplies) {
        __RICH_JSON_LATE_APPLIES.forEach(cmd => setCommandEnabled(cmd, true));
    }

    if (__RICH_JSON_CONFIG.fileCacheEnabled) {
        FILE_CACHE[path] = mergeIntoTarget(FILE_CACHE[path], rv);
    }

    return rv;
}