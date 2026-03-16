## Welcome to RichJSON: JSON with inheritances, references and commands

**RichJSON** is a powerful extension of the standard JSON format, meticulously designed to make your data highly modular, reusable, and significantly more compressed. By eliminating redundancy through intelligent referencing, it bridges the gap between human-readable configuration and machine-efficient data structures.

---

## Why RichJSON?

RichJSON is optimized to store JSON data in a space-efficient manner. While standard JSON often suffers from "data bloat" due to repeated objects, RichJSON allows you to define data once and reference it everywhere.

> [!NOTE] 
> This library is optimized for **compact storage and network bandwidth savings**. It is designed for scenarios where reducing IO and footprint is more critical than raw writing or querying throughput.

---

## Key Features

RichJSON maintains **100% compatibility** with standard JSON parsers while introducing a sophisticated layer of logic:
- **Zero-Violation Format:** Valid JSON syntax that any standard editor can read.
- **Smart Referencing (`$ref`):** Point to objects, files, or environment variables to avoid duplication.
- **Multi-Inheritance:** Build complex objects by inheriting from existing JSON structures.
- **Nested Interpolation:** Dynamic string resolution within your data fields.
- **Custom Commands:** Extend the logic with your own modules for specific business use cases.

---

## How It Works

#### 1. Define your structure

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

```JS
import * as RichJson from "@rjson/parser"

let obj = RichJson.parse(data);
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

---

## Get Started

Ready to shrink your footprints and modularize your workflow?

* Checkout the [documentation](https://github.com/0xMaxLab/rjson-parser/wiki).
