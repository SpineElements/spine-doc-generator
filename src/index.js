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
  analyze: argv => {
    const templateFilePath = 'src/template/element-doc-template.html';
    const itemsRootPath = argv[2];

    if (!itemsRootPath) {
      throw new Error('Package or element root path is required');
    }

    const analyzer = new Analyzer({
      urlLoader   : new FSUrlLoader(itemsRootPath),
      urlResolver : new PackageUrlResolver()
    });

    analyzer.analyzePackage().then(_package => {
      const metadata = generateAnalysis(_package, '');
      const elements = {};

      const processingPackage = !Boolean(
          metadata.elements.find(item => item.path.indexOf(path.sep) === -1));

      const absoluteDirPath = /^(\D:\\)/.test(itemsRootPath) || /^\//.test(
          itemsRootPath) // checking is path absolute or not
          ? itemsRootPath
          : `${process.cwd()}${path.sep}${itemsRootPath}`;

      if (processingPackage) {
        console.log(`Processing package from the ${absoluteDirPath} directory`);

        metadata.elements.forEach(item => {
          const elementRootPath = item.path.substring(0,
              item.path.indexOf(path.sep));
          if (elements[elementRootPath]) {
            elements[elementRootPath].push(item);
          } else {
            elements[elementRootPath] = [item];
          }
        });
      } else {
        console.log(`Processing element from the ${absoluteDirPath} directory`);

        const elementRootPath = itemsRootPath.substring(
            itemsRootPath.lastIndexOf(path.sep) + 1);
        elements[elementRootPath] = metadata.elements;
      }

      fs.readFile(templateFilePath, 'utf-8', (err, data) => {
        if (err) {
          throw new Error(`Failed to read the template\n${err.message}`);
        }

        Object.keys(elements).forEach((rootPath, index) => {
          const docFilePath = processingPackage
              ? `${itemsRootPath}/${rootPath}/index.html`
              : `${itemsRootPath}/index.html`;

          const docFileContent = fillContent(data, elements[rootPath],
              rootPath);
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
    });

    function fillContent(fileData, elements, elementRoot) {
      const mainElement = elements.find(item => item.tagname === elementRoot);
      const sortedElements = elements.length > 1 && mainElement
          ? [mainElement,
            ...elements.filter(item => item.tagname !== elementRoot)]
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

    function getElementDocViewer(element) {
      const elementName = element.tagname;

      return `<iron-doc-element descriptor="${escape(JSON.stringify(element))}"
                            id="${elementName}"></iron-doc-element>`;
    }

    function getNavigationItemOption(element) {
      return `<button contentid="${element.tagname}">${element.tagname}</button>`;
    }
  }
};
