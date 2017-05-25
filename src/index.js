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

module.exports = {
  generate: argv => {
    const templateFilePath = path.join(__dirname, "template", "element-doc-template.html");
    const itemsRootPath = path.resolve(argv[2] || './');

    const analyzer = new Analyzer({
      urlLoader   : new FSUrlLoader(itemsRootPath),
      urlResolver : new PackageUrlResolver()
    });

    analyzer.analyzePackage().then(_package => {
      const metadata = generateAnalysis(_package, '');
      let elements;

      const processingPackage = !Boolean(
          metadata.elements.find(item => item.path.indexOf(path.sep) === -1));

      elements = splitByElements(metadata.elements, itemsRootPath);

      console.log(`Processing ${processingPackage ? "package" : "element"} ` +
                  `from the ${itemsRootPath} directory`);

      createDocFiles(templateFilePath, elements, itemsRootPath, processingPackage);
    });
  }
};

function splitByElements(rawElementsData, itemsRootPath) {
  const elements = {};

  rawElementsData.forEach(item => {
    const elementRootPath =
        item.path.substring(0, item.path.indexOf(path.sep)) || getElementName(itemsRootPath);

    if (elements[elementRootPath]) {
      elements[elementRootPath].push(item);
    } else {
      elements[elementRootPath] = [item];
    }
  });

  return elements;
}

function createDocFiles(templateFilePath, elements, itemsRootPath, processingPackage) {
  fs.readFile(templateFilePath, 'utf-8', (err, data) => {
    if (err) {
      throw new Error(`Failed to read the template\n${err.message}`);
    }

    Object.keys(elements).forEach((rootPath, index) => {
      const docFilePath = processingPackage
          ? `${itemsRootPath}/${rootPath}/index.html`
          : `${itemsRootPath}/index.html`;

      const docFileContent = fillContent(data, elements[rootPath], rootPath);
      fs.writeFile(docFilePath, docFileContent, err => {
        if (err) {
          throw new Error(`Failed to fill the doc file\n${err.message}`);
        }
        if (index === Object.keys(elements).length - 1) {
          console.log('Documentation is generated!')
        }
      });
    });
  });
}

function fillContent(fileData, elements, elementRoot) {
  const mainElement = elements.find(item => item.tagname === elementRoot);
  const sortedElements = elements.length > 1 && mainElement
      ? [mainElement, ...elements.filter(item => item.tagname !== elementRoot)]
      : elements;

  const elementNavigationItems = sortedElements.length > 1
      ? sortedElements.map(item => getNavigationItemOption(item)).join('')
      : getNavigationItemOption(sortedElements[0]);

  const elementsContent = sortedElements.length > 1
      ? sortedElements.map(item => getElementDocViewer(item)).join('')
      : getElementDocViewer(sortedElements[0]);

  return fileData
    .replace('__TITLE__', elementRoot)
    .replace('__ELEMENT_NAVIGATION_ITEMS__', elementNavigationItems)
    .replace('__ELEMENTS_CONTENT__', elementsContent)
    .replace('__MAIN_ELEMENT__', elementRoot);
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
