/**
 * Copyright IBM Corp. 2018, 2018
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-console */

'use strict';

const fs = require('fs-extra');
const Joi = require('joi');
const yaml = require('js-yaml');
const search = require('../src/search');

// Checks:
// 1) That all icons are present in metadata
// 2) That all icons have a category
// 3) If an icon has a size in source, make sure it exists in metadata
async function check({ categoriesPath, metadataPath, iconsPath }) {
  const categoriesConfig = yaml.safeLoad(
    await fs.readFile(categoriesPath, 'utf8')
  );
  const metadataConfig = yaml.safeLoad(await fs.readFile(metadataPath, 'utf8'));
  const { error, value: iconMetadata } = Joi.validate(
    metadataConfig,
    metadataSchema
  );
  if (error) {
    throw error;
  }

  const {
    error: categoriesValidationError,
    value: categoriesMetadata,
  } = Joi.validate(categoriesConfig, categoriesSchema);
  if (error) {
    throw categoriesValidationError;
  }

  const { icons: metadata } = iconMetadata;
  const { categories } = categoriesMetadata;
  const icons = await search(iconsPath);

  const missingIconsFromMetadata = [];
  const missingVariantFromMetadata = [];
  const missingSizesFromMetadata = [];

  for (const icon of icons) {
    const [sharedName, ...variants] = icon.basename.split('--');
    const entry = metadata.find(entry => {
      return entry.name === sharedName;
    });

    if (entry === undefined) {
      missingIconsFromMetadata.push(icon.basename);
      continue;
    }

    // If we're dealing with an icon at the root level
    if (variants.length === 0) {
      if (!Array.isArray(entry.sizes) || !entry.sizes.includes(icon.size)) {
        missingSizesFromMetadata.push(icon.basename);
        continue;
      }
    }

    if (variants.length > 0) {
      if (!Array.isArray(entry.variants)) {
        missingVariantFromMetadata.push(icon.basename);
        continue;
      }

      const variant = entry.variants.find(variant => {
        return icon.basename === variant.name;
      });

      if (!variant) {
        missingVariantFromMetadata.push(icon.basename);
      }
    }
  }

  if (missingIconsFromMetadata.length > 0) {
    throw new Error(
      `The following icons are missing or an error has occurred:\n` +
        JSON.stringify(missingIconsFromMetadata, null, 2)
    );
  }

  if (missingVariantFromMetadata.length > 0) {
    throw new Error(
      `The following icon variants are missing or an error has occurred:\n` +
        JSON.stringify(missingVariantFromMetadata, null, 2)
    );
  }

  if (missingSizesFromMetadata.length > 0) {
    throw new Error(
      `The following icon sizes are missing or an error has occurred:\n` +
        JSON.stringify(missingSizesFromMetadata, null, 2)
    );
  }

  const index = new Set(icons.map(icon => icon.basename));
  const miscategorizedOrMissingIcons = [];

  const members = [];
  for (const category of categories) {
    for (const subcategory of category.subcategories) {
      for (const member of subcategory.members) {
        if (!index.has(member)) {
          miscategorizedOrMissingIcons.push(member);
        }
        members.push(member);
      }
    }
  }

  if (miscategorizedOrMissingIcons.length > 0) {
    throw new Error(
      `The following icons are included in categories but do not exist in ` +
        `the icon source folder:\n` +
        JSON.stringify(miscategorizedOrMissingIcons, null, 2)
    );
  }

  const iconsWithoutCategory = [];
  for (const name of index) {
    if (members.indexOf(name) === -1) {
      iconsWithoutCategory.push(name);
    }
  }

  if (iconsWithoutCategory.length > 0) {
    throw new Error(
      `The following icons are included in source but do not exist in ` +
        `categories.yml:\n` +
        JSON.stringify(iconsWithoutCategory, null, 2)
    );
  }
}

const aliasesSchema = Joi.array().items(Joi.string());
const categorySchema = Joi.array().items(
  Joi.object().keys({
    name: Joi.string().required(),
    subcategory: Joi.string().required(),
  })
);

const baseIconSchema = Joi.object().keys({
  name: Joi.string().required(),
  friendly_name: Joi.string().required(),
  usage: Joi.string().required(),
  sizes: Joi.array().items(
    Joi.number().only(16, 20, 24, 32),
    Joi.string().only('glyph')
  ),
  aliases: aliasesSchema,
  categories: categorySchema.required(),
});

const iconSchema = baseIconSchema.keys({
  aliases: Joi.array()
    .items(Joi.string())
    .required(),
  variants: Joi.array().items(baseIconSchema),
});

const categoriesSchema = Joi.array().items(
  Joi.object().keys({
    name: Joi.string().required(),
    subcategories: Joi.array().items(
      Joi.object()
        .keys({
          name: Joi.string().required(),
          members: Joi.array().items(Joi.string()),
        })
        .required()
    ),
  })
);

const metadataSchema = Joi.object().keys({
  icons: Joi.array()
    .items(iconSchema)
    .required(),
});

module.exports = check;
