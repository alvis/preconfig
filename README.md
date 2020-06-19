# ![Logo](logo.svg)

<div align="center">

_No more copy and paste! No more hundred lines of config!_

•   [Quick Start](#quick-start)   •   [Usage](#usage)   •   [Syntax](#variable-syntax)   •   [About](#about)   •

</div>

#### Highlights
Preconfig relieves your headaches by allowing you to:

- **manage templates in any format**: preconfig only takes the input as a plain text, so any format works!
- **import content from other locations**: from [env](#env), a [file](#file), or even within [itself](#self).
- **split configs into smaller chunks**: txt, json, yaml or other format, all up to you!
- **generate content with nested control syntax**: e.g. `${base64encode(${var:data})}`

![Demo](https://raw.githubusercontent.com/jakubroztocil/httpie/master/httpie.gif)

## Quick Start

```shell
$ echo '{"name":"preconfig","message":"hello ${var:_}! This is ${self:name}"}' | preconfig -v _=world
> {"name":"preconfig","message":"hello world! This is preconfig"}
```

## Usage

Preconfig provides two ways to generate configs, either through a command-line interface (CLI) or a programatic interface.

### Command-Line Interface

Preconfig is shipped with a command-line interface with with the following options:

```
  --help           Show help                                                               [boolean]
  --version        Show version number                                                     [boolean]
  --output, -o     Path to output file                                                      [string]
  --output-format, -f     Output format                           [string] [choices: "raw", "json", "yaml"]
  --variables, -v  Variables to be used                                                      [array]
```

Through a globally installed binary, you can transform a json, yaml, or ts/js file simply by either

- supply a file to the CLI, or

```shell
$ preconfig <file> [options]
```

- supply the content via stdin

```shell
$ echo <something> | preconfig [options]
```

**Examples**:

- Print the transformed content on stdout

```shell
$ cat template.cfg | preconfig
```

- Print the transformed default export on stdout

```shell
$ preconfig template.cfg
```

- Transform an input into another format

```shell
$ preconfig template.yml -f json
```

- Save the transformed file in another format such as config.json (No output on stdout)

```shell
$ preconfig template.yml -o config.json
```

- Substitute with variables

```shell
$ echo '{"ref":"${self:config.env}","config":{"env":"${var:dev}"}}' | preconfig -v env=dev
```

- Output a base64 decoded content on stdout

```shell
$ echo '${base64decode(${file(path_to_file)})}' | preconfig
```

### Programatic

You can also use preconfig programatically if you need to generate config in your workflow.

To do so, frist install preconfig as a standard package in your project,
then start by importing `Template` to use preconfig to manage your config template, 

```ts
import { Template } from 'preconfig';

const template = new Template('<plain text template>');

// resolve the template with variable pairs
console.log(await template.resolve({ key: 'value' }));
```

You can also load a template file and resolve it into another compatible format, for example

```ts
import { readFile, writeFile } from 'fs-extra';
import { Template } from 'preconfig';

const template = new Template(await readFile('<path to a template file>'));
await writeFile(
  '<path to output>',
  await template.resolve({ key: 'value' }, { format: '<raw, json or yaml>' }),
);
```

## Variable Syntax

There are several options for you to control how the config is generated.

Preconfig replaces any variables with the syntax \${source, [default]}, where `source` can be one of those:

- \${var:_path_} - a variable supplied either to the CLI or the programatic interface
- \${env:_path_} - a variable from the environment
- \${self:_path_} - a variable from a different part of the same document
- \${base64decode(_encoded_content_)}, \${base64encode(_plain_content_)} - base64 decode/encode a string from a variable
- \${file(_file_):_path_} - a variable from a file

and `default` is an optional input for the default content when the source is not available.

**NOTE:** if the source cannot be found and the default is not set, a missing source exception will be thrown.

_PRO TIPS:_ if you use typescript as a variable source, you can use further enjoy type checking with an interface!

### Examples

#### Referencing supplied variables

```sh
$ export ENV=dev
$ preconfig input.yaml --variables key=value
```

<table>
<tr><th>IN</th><th>OUT</th></tr>
<tr><td>

```yaml
env: ${env:ENV}
var: ${var:key}
```

</td><td>

```yaml
env: dev
var: value
```

</td></tr>
</table>

---

#### Variable with a default

<table>
<tr><th>IN</th><th>OUT</th></tr>
<tr><td>

```yaml
other: value
var: ${self:non.existent.path, 'default'}
```

</td><td>

```json
{
  "other": "value"
  "var": "default"
}
```

</td></tr>
</table>

---

### Referencing variables from the same file

<table>
<tr><th>IN</th><th>OUT</th></tr>
<tr><td>

```json
{
  "a": { "b": { "c": "d" } },
  "d": "${self:a.b.c}"
}
```

</td><td>

```json
{
  "a": { "b": { "c": "d" } },
  "d": "d"
}
```

</td></tr>
</table>

**NOTE:** For a multi-part yaml file, path is prefixed with the index number, e.g.

<table>
<tr><th>IN</th><th>OUT</th></tr>
<tr><td>

```yaml
---
name: name
---
ref: ${self:1.name}
```

</td><td>

```yaml
---
name: name
---
ref: name
```

</td></tr>
</table>

### Nested Embedding (PRO)

All variable controls can be nested. For example:

**IN**

```
{
  a: 'b',
  b: {
    c: 'd'
  },
  d: ${self:${a}.c}
}
```

**OUT**

```
{
  a: "b",
  b: {
    c: "d"
  },
  d: "d"
}
```

## About

Getting a right config is already hard, managing a number of interrelated configs is even harder.
From configs for different environments to sharing settings across applications, there are just enough reasons to hate writing config files manually.

Designed with extensibility and manageability in mind, preconfig is a language agnostic config file transpiler.
Under the hood, it builds an [abstract syntax tree (AST)](https://en.wikipedia.org/wiki/Abstract_syntax_tree) of the input,
and substitutes any control syntax with the intended output.

This tool is originally designed for my DevOps workflow, which involves heavy reuses of many configuration files.
I hate copy and paste settings whenever a deploy template get updated, and I'm pretty sure you feel the same.
Therefore, I make this tool available to everyone who has a similar problem as me.

Any suggestion or issue? Check the [issues](/issues) section or open a new issue.

### Related Projects

- [spruce](https://github.com/geofffranks/spruce): spruce is a general purpose YAML & JSON merging tool.

### License

Copyright © 2020, [Alvis Tang](https://github.com/alvis). Released under the [MIT License](LICENSE).


[![release](https://img.shields.io/github/v/release/alvis/presetter?sort=semver&style=flat-square)](https://github.com/alvis/preconfig/releases)
[![build](https://img.shields.io/github/workflow/status/alvis/presetter/continuous%20integration?style=flat-square)](../actions)
[![codacy grade](https://img.shields.io/codacy/grade/fcb13294d2f24f54988bb001ae8676f8/master.svg?style=flat-square)](https://www.codacy.com/app/alvis/preconfig)
[![codacy coverage](https://img.shields.io/codacy/coverage/fcb13294d2f24f54988bb001ae8676f8.svg?style=flat-square)](https://www.codacy.com/app/alvis/preconfig)
[![security](https://img.shields.io/snyk/vulnerabilities/github/alvis/presetter?style=flat-square)](https://snyk.io/test/github/alvis/preconfig)
[![dependencies](https://img.shields.io/david/alvis/preconfig.svg?style=flat-square)](https://david-dm.org/alvis/preconfig)
[![license](https://img.shields.io/github/license/alvis/preconfig.svg?style=flat-square)](https://github.com/alvis/preconfig/blob/master/LICENSE)
