# spine-doc-generator

The command-line tool for Web Components documentation generating.
[Polymer-analyzer](https://github.com/Polymer/polymer-analyzer) is used under the hood.

## Installation
```bash
npm install -g SpineElements/spine-doc-generator
```

## Command overview

### `spine-doc-generator [element-root]`
Where `element-root` - path to the element root directory.\
If `element-root` is omitted, the current directory is used as the root path.

Generated documentation file is stored in the `element-root/index.html` file.

## Usage

For the following file structure:
```
|-- some-element
    |-- some-element.html
    |-- some-helper.html
    |-- some-part
        |-- some-part.html
```
Run `spine-doc-generator` from the `some-element` folder
or `spine-doc-generator path/to/some-element` from any other folder.

Result:
```
|-- some-element
    |-- index.html <------------ created documentation
    |-- some-element.html
    |-- some-helper.html
    |-- some-part
        |-- some-part.html
```
