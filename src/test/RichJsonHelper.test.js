import { expect, test } from 'vitest'
import {cloneObject, mergeObjects, mergeObjectsWithoutRebind, resolveAddress} from "../main/RichJsonHelper";

test('mergeObjects', () => {
    let obj3 = {
        "y": 15,
        "data": {
            "name": "obj3",
            "size": 173,
            "age": 15
        },
        "func": () => 5 + 7
    };
    let obj2 = {
        "x": 10,
        "data": {
            "age": 17
        },
        "other": obj3,
    };
    let obj1 = {
        "x": 5,
        "y": 5,
        "data": {
            "name": "obj1",
        },
        "other": obj2,
        "func": () => 5 + 5
    };


    let res = mergeObjects(obj1, obj2, obj3);

    expect(res.x).toBe(5);
    expect(res.y).toBe(5);
    expect(res.data.name).toBe("obj1");
    expect(res.data.age).toBe(17);
    expect(res.data.size).toBe(173);
    expect(res.other).toBe(obj2);
    expect(res.func === obj1.func).toBeFalsy();
    expect(res.func()).toBe(obj1.func());

    expect(res.other.x).toBe(10);
    expect(res.other.y).toBe(15);
    expect(res.other.data.name).toBe("obj3");
    expect(res.other.data.age).toBe(17);
    expect(res.other.data.size).toBe(173);
    expect(res.other.other).toBe(obj3);

    res = mergeObjects(obj3, obj2, obj1);

    expect(res.x).toBe(10);
    expect(res.y).toBe(15);
    expect(res.data.name).toBe("obj3");
    expect(res.data.age).toBe(15);
    expect(res.data.size).toBe(173);
    expect(res.other).toBe(obj3);
    expect(res.func === obj3.func).toBeFalsy();
    expect(res.func()).toBe(obj3.func());

    expect(res.other.x).toBe(10);
    expect(res.other.y).toBe(15);
    expect(res.other.data.name).toBe("obj3");
    expect(res.other.data.age).toBe(15);
    expect(res.other.data.size).toBe(173);
    expect(res.other.other).toBe(obj3);

    expect(obj2.x).toBe(10);
    expect(obj2.y).toBe(15);
    expect(obj2.data.name).toBe("obj3");
    expect(obj2.data.age).toBe(17);
    expect(obj2.data.size).toBe(173);

    expect(obj3.x).toBe(10);
    expect(obj3.y).toBe(15);
    expect(obj3.data.name).toBe("obj3");
    expect(obj3.data.age).toBe(15);
    expect(obj3.data.size).toBe(173);
});

test('mergeObjectsWithoutRebind', () => {
    let obj3 = {
        "y": 15,
        "data": {
            "name": "obj3",
            "size": 173,
            "age": 15
        },
        "func": () => 5 + 7
    };
    let obj2 = {
        "x": 10,
        "data": {
            "age": 17
        },
        "other": obj3,
    };
    let obj1 = {
        "x": 5,
        "y": 5,
        "data": {
            "name": "obj1",
        },
        "other": obj2,
        "func": () => 5 + 5
    };


    let res = mergeObjectsWithoutRebind(obj1, obj2, obj3);

    expect(res.x).toBe(5);
    expect(res.y).toBe(5);
    expect(res.data.name).toBe("obj1");
    expect(res.data.age).toBe(17);
    expect(res.data.size).toBe(173);
    expect(res.other).toBe(obj2);
    expect(res.func === obj1.func).toBeTruthy();
    expect(res.func()).toBe(obj1.func());

    expect(res.other.x).toBe(10);
    expect(res.other.y).toBe(15);
    expect(res.other.data.name).toBe("obj3");
    expect(res.other.data.age).toBe(17);
    expect(res.other.data.size).toBe(173);
    expect(res.other.other).toBe(obj3);

    res = mergeObjectsWithoutRebind(obj3, obj2, obj1);

    expect(res.x).toBe(10);
    expect(res.y).toBe(15);
    expect(res.data.name).toBe("obj3");
    expect(res.data.age).toBe(15);
    expect(res.data.size).toBe(173);
    expect(res.other).toBe(obj3);
    expect(res.func === obj3.func).toBeTruthy();
    expect(res.func()).toBe(obj3.func());

    expect(res.other.x).toBe(10);
    expect(res.other.y).toBe(15);
    expect(res.other.data.name).toBe("obj3");
    expect(res.other.data.age).toBe(15);
    expect(res.other.data.size).toBe(173);
    expect(res.other.other).toBe(obj3);

    expect(obj2.x).toBe(10);
    expect(obj2.y).toBe(15);
    expect(obj2.data.name).toBe("obj3");
    expect(obj2.data.age).toBe(17);
    expect(obj2.data.size).toBe(173);

    expect(obj3.x).toBe(10);
    expect(obj3.y).toBe(15);
    expect(obj3.data.name).toBe("obj3");
    expect(obj3.data.age).toBe(15);
    expect(obj3.data.size).toBe(173);
});

test('cloneObject', () => {
    let obj = {
        "y": 15,
        "data": {
            "name": "obj3",
            "size": 173,
            "age": 15
        },
        "func": () => 5 + 7,
        "array": [],
    };
    obj["self"] = obj;
    obj.array.push(obj);

    let res = cloneObject(obj);

    expect(res === obj).toBeFalsy();
    expect(res.data === obj.data).toBeFalsy();
    expect(res.func === obj.func).toBeFalsy();
    expect(res.array === obj.array).toBeFalsy();
    expect(res.self).toBe(res);
    expect(res.array[0]).toBe(res);
    expect(res.y).toBe(15);
    expect(res.self.y).toBe(15);
    expect(res.data.name).toBe("obj3");
    expect(res.func()).toBe(obj.func());
})