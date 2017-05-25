# spine-doc-generator

The command-line tool for Web Components documentation generating.
[Polymer-analyzer](https://github.com/Polymer/polymer-analyzer) is used under the hood.

## Installation
```bash
npm install -g git://github.com/SpineElements/spine-doc-generator.git
```

## Example

### `spine-doc-generator [items-root]`
If `items-root` omitted, the current directory is used as the root path.

Generated docs location: `items-root/element-root/index.html`.

### Processing one element

For the next file structure:
```
some-element
  - some-element.html
  - some-part.html
  - some-helper.html
```
Run `spine-doc-generator` from the `some-element` folder
or `spine-doc-generator some-element` from the parent folder

### Processing a package

For the next file structure:
```
elements
  - some-element
  - another-element
  - third-element
```
Run `spine-doc-generator` from the `elements` folder
or `spine-doc-generator elements` from the parent folder
