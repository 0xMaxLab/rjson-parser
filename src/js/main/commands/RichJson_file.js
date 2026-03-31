/*
    reads the given json file
*/


import {concatStrings} from "../helper/RichJsonHelper.js";
import {readFile} from "../helper/RichJsonFileHelper.js";

export function __executeFileCommand(parser, context) {
    return readFile(concatStrings(context.currentMember, ".json"), true);
}