/*
 * Copyright (c) 2000-2017 TeamDev Ltd. All rights reserved.
 * TeamDev PROPRIETARY and CONFIDENTIAL.
 * Use is subject to license terms.
 */

const {
  Analyzer, FSUrlLoader, PackageUrlResolver, generateAnalysis
} = require('polymer-analyzer');
const escape = require('html-escape');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

module.exports = {
  generate: argv => {
    const templateFilePath = path.join(__dirname, "template", "element-doc-template.html");
    const args = {
      root: path.resolve("./"),
      overwrite: argv[2] === "-f"
    };

    const analyzer = new Analyzer({
      urlLoader   : new FSUrlLoader(args.root),
      urlResolver : new PackageUrlResolver()
    });

    analyzer.analyzePackage().then(_package => {
      const metadata = generateAnalysis(_package, '');

      console.log(`Processing element from the ${args.root} directory`);

      createDocFile(templateFilePath, metadata.elements, args);
    });
  }
};

function createDocFile(templateFilePath, elements, args) {
  fs.readFile(templateFilePath, 'utf-8', (err, data) => {
    if (err) {
      throw new Error(`Failed to read the template\n${err.message}`);
    }

    const docFilePath = `${args.root}${path.sep}index.html`;
    const docFileContent = fillContent(data, elements, args.root);

    if (!args.overwrite && fs.existsSync(docFilePath)) {
      const rlInterface = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rlInterface.question(`File ${docFilePath} already exists.\nOverwrite it? |no| `, answer => {
        fileExistsDialog(answer, rlInterface, () => writeDocFile(docFilePath, docFileContent));
      });
    } else {
      writeDocFile(docFilePath, docFileContent);
    }
  });
}

function fileExistsDialog(answer, rlInterface, successCallback) {
  const lowerCaseAnswer = answer.toLowerCase();
  if (lowerCaseAnswer === "yes" || lowerCaseAnswer === "y") {
    successCallback();
    rlInterface.close();

  } else if (lowerCaseAnswer === "no" || lowerCaseAnswer === "n") {
    console.log('Documentation generation canceled.');
    process.exit(0);

  } else {
    console.log('Please enter "yes" or "no".\n');
    rlInterface.question(`Overwrite it? |no| `, answer => {
      fileExistsDialog(answer, rlInterface, successCallback);
    });
  }
}

function writeDocFile(filePath, content) {
  fs.writeFile(filePath, content, err => {
    if (err) {
      throw new Error(`Failed to fill the doc file\n${err.message}`);
    }
    console.log(`Created file: ${filePath}\nDocumentation generation completed.`);
  });
}

function fillContent(fileData, elements, itemsRootPath) {
  const mainElementName = getElementName(itemsRootPath);
  const mainElement = elements.find(item => item.tagname === mainElementName);
  const sortedElements = elements.length > 1 && mainElement
      ? [mainElement, ...elements.filter(item => item.tagname !== mainElementName)]
      : elements;

  const elementNavigationItems = sortedElements.length > 1
      ? sortedElements.map(item => getNavigationItemOption(item)).join('')
      : getNavigationItemOption(sortedElements[0]);

  const elementsContent = sortedElements.length > 1
      ? sortedElements.map(item => getElementDocViewer(item)).join('')
      : getElementDocViewer(sortedElements[0]);

  return fileData
    .replace('__TITLE__', mainElementName)
    .replace('__ELEMENT_NAVIGATION_ITEMS__', elementNavigationItems)
    .replace('__ELEMENTS_CONTENT__', elementsContent)
    .replace('__MAIN_ELEMENT__', mainElementName);
}

function getElementDocViewer(rawElement) {
  const elementName = rawElement.tagname;
  const element = removeExternalDependencies(rawElement);

  return `<iron-doc-element descriptor="${escape(JSON.stringify(element))}"
                            id="${elementName}"></iron-doc-element>`;
}

function getNavigationItemOption(element) {
  return `<button contentid="${element.tagname}">${element.tagname}</button>`;
}

function getElementName(itemsRootPath) {
  const normalizedPath = itemsRootPath.lastIndexOf(path.sep) === itemsRootPath.length - 1
      ? itemsRootPath.substring(0, itemsRootPath.length - 1)
      : itemsRootPath;

  return normalizedPath.substring(normalizedPath.lastIndexOf(path.sep) + 1);
}

function removeExternalDependencies(element) {
  const isItemFromExternalDependency = fileName =>
      /(\bbower_components\b)|(\bnode_modules\b)/.test(fileName);

  element.methods = element.methods.filter(method =>
      !isItemFromExternalDependency(method.sourceRange.file));
  element.properties = element.properties.filter(property =>
      !isItemFromExternalDependency(property.sourceRange.file));

  return element;
}
