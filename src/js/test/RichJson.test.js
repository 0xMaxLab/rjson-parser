import {expect, test} from 'vitest'
import {
    excludeModule,
    includeModule,
    registerModule,
    RichJsonModule,
    unregisterModule
} from "../main/module/RichJsonModule.js";
import {mergeObjects} from "../main/helper/RichJsonHelper.js";
import {parse} from "../main/core/RichJson_parse.js";
import stringify from "json-stable-stringify";
import {isResolved} from "../main/helper/RichJson_isResolved.js";
import {RichJsonTestClass} from "./RichJsonTestClass";
import {addEnvironmentVariable} from "../main/other/RichJsonEnvironment.js";
import {addClassMapping} from "../main/index.js";

test('Module', () => {
    let content = {
        "first": "$ilog:Hello World!",
    };

    registerModule(
        new RichJsonModule("test")
            .addCommand("ilog", function (_cryptkey, _add_to_cache, _root, _command, _message, _address, _name) {
                console.log("file_struct_plain_rich_json_module_ok: " + _message);
                return "success";
            })
    );
    includeModule("test");

    parse(content);

    expect(content).toBeDefined();
    expect(content.first).toBe("success");

    content = {
        "first": "$ilog:Hello World!",
    };

    excludeModule("test");
    unregisterModule("test");

    try {
        content = parse(content);
    } catch {
        // ignore
    }

    expect(content.first).toBe("$ilog:Hello World!");
});

class RichJsonTestClass {}

test('Constructor', () => {
    addClassMapping("RichJsonTestClass", RichJsonTestClass);
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

    parse(content);

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
            "other": "$ref:second"
        },
        "second::third": {
            "x": 5
        },
        "third::first": {
            "other": "$ref:first"
        }
    };

    parse(content);

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
            "$clone:third": {
                "fourth": "fourth"
            }
        },
        "fourth": {
            "fifth": "fifth",
            "sixth": "$ref$clone:first/third"
        }
    };

    parse(content);

    expect(stringify(content.fourth.sixth)).toBe(stringify(content.first.third))
    expect(content.fourth.sixth === content.first.third).toBeFalsy();
});

test('Pipe', () => {
    let content = {
        "first": {
            "second": "second",
            "third": {
                "fourth": "$ref:fourth|fifth"
            }
        },
        "fourth": {
            "fifth": "fifth",
            "sixth": "$ref:first/third"
        }
    };

    parse(content);

    expect(content.first.third.fourth).toBe("fifth");
});

test('Array', () => {
    let content = {
        "first": [
            {
                "second": "second",
            }
        ],
        "third": "$ref:first[0]",
    };

    parse(content);

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
        "fourth": "test_{$ref:    first/third  }_test",
        "fifth": "test_{{} $ref:first/third {}}",
        "sixth": "test_{{}$ref:first/{$ref:first/third   }/third{}}{$ref:first/second}",
        "seventh": "test_{{}$ref:first/{$ref:{$ref:first/first}/{$ref:  first/third } }/third{}}",
        "eigth": "$ref:first/{$ref:first/third}"
    };

    parse(content);

    expect(content.fourth).toBe("test_third_test");
    expect(content.fifth).toBe("test_{ $ref:first/third }");
    expect(content.sixth).toBe("test_{$ref:first/third/third}second");
    expect(content.seventh).toBe("test_{$ref:first/third/third}");
    expect(content.eigth).toBe("third");
});

test('isResolved', () => {
    let content = {
        "first": "$ref:second",
        "second": "second"
    };

    let res = isResolved(content);

    expect(res).toBeFalsy();

    content = {
        "first": "{$ref:second}",
        "second": "second"
    };

    res = isResolved(content);

    expect(res).toBeFalsy();
});

test('$ref', () => {
    let content = {
        "first": {
            "second": "second",
            "third": {
                "fourth": "$ref:fourth/fifth"
            }
        },
        "fourth": {
            "fifth": "$ref:first/third/fourth",
            "sixth": "$ref:fourth/seventh",
            "seventh": {
                "eigth": "$ref:fourth",
            },
        }
    };

    parse(content);

    expect(content.first.third.fourth).toBe(content.fourth.fifth);
    expect(content.fourth.seventh.eigth).toBe(content.fourth);
});

test('$env', () => {
    let content = {
        "env": "$env:RichJsonTestEnv"
    };

    addEnvironmentVariable("RichJsonTestEnv", "Hello World!");
    parse(content);

    expect(content.env).toBe("Hello World!");
})

test('$this', () => {
    let content = {
        "this": "$this:"
    }

    parse(content);

    expect(content).toBe(content.this)
    expect(content.this).toBe(content.this.this)
    expect(content.this.this).toBe(content.this.this.this.this.this.this)
})

test('$merge', () => {
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
            "fifth": "$merge:first/second, first/third",
        },
        "sixth": "$merge:fourth/fifth, first",
        "seventh": ["v1", "v2"],
        "eigth": ["v3", "v4"],
        "ninth": "$merge:seventh, eigth",
        "tenth": "$merge:ninth, eigth",
    };

    parse(content);

    expect(stringify(content.fourth.fifth)).toBe(stringify(mergeObjects(content.first.second, content.first.third)));
    let tenth = [];
    tenth.join(content.seventh);
    tenth.join(content.eigth);
    tenth.join(content.eigth);
    expect(stringify(content.tenth)).toBe(stringify(tenth));
});

test('$copy', () => {
    let content = {
        "first": {
            "second": "second",
            "test": "$copy:first",
        },
        "third": "$copy:first",
    };

    parse(content);

    expect(content.first === content.third).toBeFalsy();
    expect(stringify(content.first)).toBe(stringify(content.third));
});

test('$clone', () => {
    let content = {
        "$clone:first": {"second": "second"}
    };
    let clone = {
        "$clone:first": content["$clone:first"]
    };

    parse(clone);

    expect(content["$clone:first"] === clone.first).toBeFalsy();
});

test('$invoke', () => {
    let content = {
        "function": () => 4 + 2,
        "function_result": "$ref$invoke:function",
    };

    parse(content);

    expect(content.function()).toBe(6);
    expect(content.function_result).toBe(6);
})

test('$file', () => {
    let content = {
        "file": "$file:resources/json/test0"
    }

    parse(content);

    expect(content.file["root0"]).toBe(true);
});

test('$folder', () => {
    let content = {
        "folder": "$folder:resources/json"
    }

    parse(content);

    expect(content.folder["test0"]["root0"]).toBe(true);
    expect(content.folder["test1"]["root0"]).toBe(true);
});

test('$merge_folder', () => {
    let content = {
        "folder": "$merge_folder:resources/json"
    }

    parse(content);

    expect(content.folder["root0"]).toBe(true);
    expect(content.folder["root1"]["prop1"]).toBe("Hello World!");
});
