/**
 * Copyright IBM Corp. 2018, 2018
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-console */

'use strict';

const { sentenceCase } = require('change-case');
const fs = require('fs-extra');
const yaml = require('js-yaml');
const search = require('./search');

async function scaffold({ categoriesPath, metadataPath, iconsPath }) {
  const metadata = yaml.safeLoad(await fs.readFileSync(metadataPath, 'utf8'));
  const categoriesJson = yaml.safeLoad(
    await fs.readFileSync(categoriesPath, 'utf8')
  );

  // Get all of our icon files from the SVG directory
  const iconFiles = await search(iconsPath);

  // Group icons by a common basename, collecting all sizes
  const iconsGroupedByBasename = iconFiles.reduce((acc, icon) => {
    if (acc[icon.basename]) {
      return {
        ...acc,
        [icon.basename]: acc[icon.basename].concat(icon),
      };
    }
    return {
      ...acc,
      [icon.basename]: [icon],
    };
  }, {});

  // Group icons by common name, this means `add` and `add--filled` are both
  // grouped under `add` as the name
  const iconsGroupedByName = Object.keys(iconsGroupedByBasename).reduce(
    (acc, key) => {
      const [name, variant] = key.split('--');
      const group = acc[name] || { icon: null, variants: {} };

      if (!variant) {
        if (group.icon) {
          throw new Error(
            'This group should not have an icon already: ' + name
          );
        }
        if (iconsGroupedByBasename[key].length === 0) {
          group.icon = iconsGroupedByBasename[key][0];
        } else {
          group.icons = iconsGroupedByBasename[key];
        }
      } else {
        if (!Array.isArray(group.variants[key])) {
          group.variants[key] = [];
        }

        group.variants[key].push(...iconsGroupedByBasename[key]);
      }

      return {
        ...acc,
        [name]: group,
      };
    },
    {}
  );

  /**
   * build object that maps icon names to category & subcategory
   *   - loop through all of `categories.yml`
   *   - keys are icon names
   *   - each iconName object has props for category & subcategory
   *
   * when needing to find category information,
   * `categoryInformation[iconName].category` and
   * `categoryInformation[iconName].subcategory` will return needed info
   */
  const categoryInformation = {};
  categoriesJson.categories.forEach(category => {
    category.subcategories.forEach(subcategory => {
      subcategory.members.forEach(iconName => {
        categoryInformation[iconName] = {
          category: category.name,
          subcategory: subcategory.name,
        };
      });
    });
  });

  const icons = Object.keys(iconsGroupedByName).map(key => {
    const iconIsCategorized =
      categoryInformation[key] && categoryInformation[key].subcategory;

    const group = iconsGroupedByName[key];
    const savedIcon = metadata.icons.find(({ name }) => name === key);
    const icon = {
      name: key,
      friendly_name: savedIcon ? savedIcon.friendly_name : sentenceCase(key),
      usage: savedIcon ? savedIcon.usage : 'This is a description for usage',
      categories: iconIsCategorized
        ? [
            {
              name: categoryInformation[key].category,
              subcategory: categoryInformation[key].subcategory,
            },
          ]
        : [],
      aliases: savedIcon ? savedIcon.aliases : [key],
    };

    if (group.icon) {
      icon.sizes = [group.icon.size];
    } else if (group.icons) {
      icon.sizes = group.icons.map(icon => icon.size);
    }

    if (Object.keys(group.variants).length > 0) {
      icon.variants = Object.keys(group.variants).reduce((acc, name) => {
        const variant = group.variants[name];
        const sizes = variant.map(({ size }) => {
          if (!size) {
            return 'glyph';
          }
          return size;
        });
        const result = {
          name,
          friendly_name: sentenceCase(name),
          usage: 'This is a description for usage',
          sizes,
        };

        if (categoryInformation[name]) {
          const { category, subcategory } = categoryInformation[name];
          result.categories = [{ name: category, subcategory }];
        }

        return acc.concat(result);
      }, []);
    }

    return icon;
  });

  await fs.writeFile(metadataPath, yaml.safeDump({ icons: icons }), 'utf8');
}

module.exports = scaffold;
