# spine-doc-generator

The command-line tool for Web Components documentation generating.
[Polymer-analyzer](https://github.com/Polymer/polymer-analyzer) is used under the hood.

## Installation
```bash
npm install -g SpineElements/spine-doc-generator
```

## Command overview

### `spine-doc-generator [-f]`    
Generate documentation for an element project.

Creates the `index.html` documentation file in the `element-root/` directory. If such file already exists, the command will ask permission to overwrite it.
Note: to skip this question, use `spine-doc-generator -f`.

Option **`-f`** disables check for file existence(always overwrite).

## Usage

For the following file structure:
```
|-- some-element
    |-- some-element.html
    |-- some-helper.html
    |-- some-part
        |-- some-part.html
```
Run `spine-doc-generator` from the `some-element` folder.

Result:
```
|-- some-element
    |-- index.html <------------ created documentation
    |-- some-element.html
    |-- some-helper.html
    |-- some-part
        |-- some-part.html
```
