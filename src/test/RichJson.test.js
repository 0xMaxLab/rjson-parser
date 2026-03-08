import { expect, test } from 'vitest'
import {RichJsonModule} from "../main/RichJsonModule";
import {excludeRichJsonModule, includeRichJsonModule, registerRichJsonModule, unregisterRichJsonModule} from "../main/RichJsonModule"
import {resolveAddress, concatArrays, concatStrings, mergeObjects, __resetAddressCache} from "../main/RichJsonHelper";
import {parseRichJson} from "../main/RichJson_parse";
import stringify from "json-stable-stringify";
import {addRichJsonEnv} from "../main/commands/RichJson_cmd_env";
import {isResolved} from "../main/RichJson_isResolved";
import {RichJsonTestClass} from "./RichJsonTestClass";

test('Module', () => {
    let content = {
        "first": "#ilog:Hello World!",
    };

    registerRichJsonModule(
        new RichJsonModule("test")
            .addCommand("ilog", function(_cryptkey, _add_to_cache, _root, _command, _message, _address, _name) {
                console.log(concatStrings("file_struct_plain_rich_json_module_ok: ", _message));
                return "success";
            })
    );
    includeRichJsonModule("test");

    parseRichJson(content);

    expect(content).toBeDefined();
    expect(content.first).toBe("success");

    content = {
        "first": "#ilog:Hello World!",
    };

    excludeRichJsonModule("test");
    unregisterRichJsonModule("test");
    try {
        content = parseRichJson(content);
    } catch {
        // ignore
    }

    expect(content.first).toBe("#ilog:Hello World!");
});

test('Constructor', () => {
    let content = {
        "first=RichJsonTestClass": {
            "value": 100,
            "second": {
                "fourth": "fourth"
            }
        },
        "second=RichJsonTestClass::first": {
            "third": "third"
        }
    };

    parseRichJson(content);

    expect(content.second.value).toBe(0);
    expect(stringify(content.first.second)).toBe(stringify(content.second.second));
    expect(content.first.constructor).toBe(RichJsonTestClass);
    expect(content.second.constructor).toBe(RichJsonTestClass);
});

test('Inheritance', () => {
    let content = {
        "first::second, third": {
            "x": 10,
            "y": 5,
            "other": "#ref:second"
        },
        "second::third": {
            "x": 5
        },
        "third::first": {
            "other": "#ref:first"
        }
    };

    parseRichJson(content);

    expect(content.first.x).toBe(10);
    expect(content.first.y).toBe(5);
    expect(content.first.other).toBe(content.second);

    expect(content.second.x).toBe(5);
    expect(content.second.y).toBe(5);
    expect(content.second.other.x).toBe(content.first.x);
    expect(content.second.other.y).toBe(content.first.y);
    expect(content.second.other.other.x).toBe(content.second.x);
    expect(content.second.other.other.y).toBe(content.second.y);

    expect(content.third.x).toBe(10);
    expect(content.third.y).toBe(5);
    expect(content.third.other).toBe(content.first);
});

test('Batch', () => {
    let content = {
        "first": {
            "second": "second",
            "#clone:third": {
                "fourth": "fourth"
            }
        },
        "fourth": {
            "fifth": "fifth",
            "sixth": "#ref#clone:first/third"
        }
    };

    parseRichJson(content);

    expect(stringify(content.fourth.sixth)).toBe(stringify(content.first.third))
    expect(content.fourth.sixth === content.first.third).toBeFalsy();
});

test('Pipe', () => {
    let content = {
        "first": {
            "second": "second",
            "third": {
                "fourth": "#ref:fourth|fifth"
            }
        },
        "fourth": {
            "fifth": "fifth",
            "sixth": "#ref:first/third"
        }
    };

    parseRichJson(content);

    expect(content.first.third.fourth).toBe("fifth");
});

test('Array', () => {
    let content = {
        "first": [
            {
                "second": "second",
            }
        ],
        "third": "#ref:first[0]",
    };

    parseRichJson(content);

    expect(content.first[0]).toBe(content.third);
});

test('Interpolation', () => {
    let content = {
        "first": {
            "first": "first",
            "second": "second",
            "third": "third",
            "fourth": {
                "success": "success",
            }

        },
        "fourth": "test_{#ref:    first/third  }_test",
        "fifth": "test_{{} #ref:first/third {}}",
        "sixth": "test_{{}#ref:first/{#ref:first/third   }/third{}}{#ref:first/second}",
        "seventh": "test_{{}#ref:first/{#ref:{#ref:first/first}/{#ref:  first/third } }/third{}}",
        "eigth": "#ref:first/{#ref:first/third}"
    };

    parseRichJson(content);

    expect(content.fourth).toBe("test_third_test");
    expect(content.fifth).toBe("test_{ #ref:first/third }");
    expect(content.sixth).toBe("test_{#ref:first/third/third}second");
    expect(content.seventh).toBe("test_{#ref:first/third/third}");
    expect(content.eigth).toBe("third");
});

test('isResolved', () => {
    let content = {
        "first": "#ref:second",
        "second": "second"
    };

    let res = isResolved(content);

    expect(res).toBeFalsy();

    content = {
        "first": "{#ref:second}",
        "second": "second"
    };

    res = isResolved(content);

    expect(res).toBeFalsy();
});

test('#ref', () => {
    let content = {
        "first": {
            "second": "second",
            "third": {
                "fourth": "#ref:fourth/fifth"
            }
        },
        "fourth": {
            "fifth": "#ref:first/third/fourth",
            "sixth": "#ref:fourth/seventh",
            "seventh": {
                "eigth": "#ref:fourth",
            },
        }
    };

    parseRichJson(content);

    expect(content.first.third.fourth).toBe(content.fourth.fifth);
    expect(content.fourth.seventh.eigth).toBe(content.fourth);
});

test('#env', () => {
    let content = {
        "env": "#env:RichJsonTestEnv"
    };

    addRichJsonEnv("RichJsonTestEnv", "Hello World!");
    parseRichJson(content);

    expect(content.env).toBe("Hello World!");
})

test('#this', () => {
    let content = {
        "this": "#this:"
    }

    parseRichJson(content);

    expect(content).toBe(content.this)
    expect(content.this).toBe(content.this.this)
    expect(content.this.this).toBe(content.this.this.this.this.this.this)
})

test('#merge', () => {
    let content = {
        "first": {
            "second": {
                "second": "second"
            },
            "third": {
                "fourth": "Hello World!"
            }
        },
        "fourth": {
            "fifth": "#merge:first/second, first/third",
        },
        "sixth": "#merge:fourth/fifth, first",
        "seventh": ["v1", "v2"],
        "eigth": ["v1", "v2"],
        "ninth": "#merge:seventh, eigth",
        "tenth": "#merge:ninth, eigth",
    };

    parseRichJson(content);

    expect(stringify(content.fourth.fifth)).toBe(stringify(mergeObjects(content.first.second, content.first.third)));
    expect(stringify(content.tenth)).toBe(stringify(concatArrays(concatArrays(content.seventh, content.eigth), content.eigth)));
});

test('#copy', () => {
    let content = {
        "first": {
            "second": "second",
            "test": "#copy:first",
        },
        "third": "#copy:first",
    };

    parseRichJson(content);

    expect(content.first === content.third).toBeFalsy();
    expect(stringify(content.first)).toBe(stringify(content.third));
});

test('#clone', () => {
    let content = {
        "#clone:first": { "second": "second" }
    };
    let clone = {
        "#clone:first": content["#clone:first"]
    };
    resolveAddress(content["#clone:first"]);

    parseRichJson(clone);

    expect(resolveAddress(content["#clone:first"]) === resolveAddress(clone.first)).toBeFalsy();
});

test('#invoke', () => {
    let content = {
        "function": () => 4 + 2,
        "function_result": "#ref#invoke:function",
    };

    parseRichJson(content);

    expect(content.function()).toBe(6);
    expect(content.function_result).toBe(6);
})

test('#file', () => {
    let content = {
        "file": "#file:resources/json/test0"
    }

    parseRichJson(content);

    expect(content.file["root0"]).toBe(true);
});

test('#folder', () => {
    let content = {
        "folder": "#folder:resources/json"
    }

    parseRichJson(content);

    expect(content.folder["test0"]["root0"]).toBe(true);
    expect(content.folder["test1"]["root0"]).toBe(true);
});

test('#merge_folder', () => {
    let content = {
        "folder": "#merge_folder:resources/json"
    }

    parseRichJson(content);

    expect(content.folder["root0"]).toBe(true);
    expect(content.folder["root1"]["prop1"]).toBe("Hello World!");
});
