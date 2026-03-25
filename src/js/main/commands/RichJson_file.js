/*
    reads the given json file
*/


import {concatStrings} from "../RichJsonHelper.js";
import {readFile} from "../RichJsonFileHelper.js";

export function __executeFileCommand(parser, context) {
    return readFile(concatStrings(context.currentMember, ".json"));
}