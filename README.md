[![npm Package Version](https://img.shields.io/npm/v/@rjson/parser.svg)](https://www.npmjs.com/package/@rjson/parser)
[![Minified Package Size](https://img.shields.io/bundlephobia/min/@rjson/parser)](https://bundlephobia.com/package/@rjson/parser)
[![npm Package Downloads](https://img.shields.io/npm/dm/@rjson/parser)](https://www.npmtrends.com/@rjson/parser)

## Welcome to RichJSON: JSON with inheritances, references and commands

**RichJSON** is a powerful extension of the standard JSON format, meticulously designed to make your data highly modular, reusable, and significantly more compressed. By eliminating redundancy through intelligent referencing, it bridges the gap between human-readable configuration and machine-efficient data structures.

## 📦 Get Started

* 👉 [RichJSON Wiki](https://github.com/0xMaxLab/rjson-parser/wiki)
* 👉 [RichJSON npm (javascript)](https://www.npmjs.com/package/@rjson/parser)
```
npm install @rjson/parser
```

**TODOs:**
* 👉 [RichJSON maven (java)]()
* 👉 [RichJSON gradle (java)]()
* 👉 [RichJSON conan (c++)]()
* 👉 [RichJSON nuget (c#)]()
* 👉 [RichJSON pip (python)]() 

---

## 🌟 Why RichJSON?

RichJSON is optimized to store JSON data in a space-efficient manner. While standard JSON often suffers from "data bloat" due to repeated objects, RichJSON allows you to define data once and reference it everywhere.

> [!NOTE] 
> This library is optimized for **compact storage and network bandwidth savings**. It is designed for scenarios where reducing IO and footprint is more critical than raw writing or querying throughput.

---

## ✨ Key Features

RichJSON maintains **100% compatibility** with standard JSON parsers while introducing a sophisticated layer of logic:
- **Zero-Violation Format:** Valid JSON syntax that any standard editor can read.
- **Smart Referencing (`$ref`):** Point to objects, files, or environment variables to avoid duplication.
- **Multi-Inheritance:** Build complex objects by inheriting from existing JSON structures.
- **Nested Interpolation:** Dynamic string resolution within your data fields.
- **Custom Commands:** Extend the logic with your own modules for specific business use cases.

---

## 🛠️ How It Works

RichJSON transforms static files into dynamic structures. Here is the "magic" in action:

#### 1. Define your structure

Create a standard `.json` file and start using RichJSON commands.

```JSON
{ 
  "data_template": {
    "data0": "value",
    "data1": "value",
    "data2": "value"
  },
  "applied_reference": "$ref:data_template" 
}
```

#### 2. Resolve the data

Read the file using the `readRichJsonFile` function to expand the references.

```JS
var obj = readRichJsonFile(<filepath>);
```

#### 3. The Result

The output is a fully resolved, standard JSON object where all references are hydrated:

```JSON
{ 
  "data_template": { 
    "data0": "value",
    "data1": "value",
    "data2": "value"
  },
  "applied_reference": { 
    "data0": "value",
    "data1": "value",
    "data2": "value"
  }
}
```
