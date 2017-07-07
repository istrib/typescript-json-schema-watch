This is a simple wrapper around the excellent https://github.com/YousefED/typescript-json-schema
The primary purpose of this tool is to use TypeScript interfaces as schema specification for RESTful API messages. 

```
  Usage: typescript-json-schema-watch [options]

  Options:

    -h, --help                 output usage information
    -V, --version              output the version number
    --tsconfig <path>          Path to tsconfig.json.
    --srcRoot <path>           Path to root directory with TypeScript files.
    --srcFilePattern <glob>    E.g. **/*.schema.ts - specifies which TypeScript files to process. This is relative to --srcRoot.
    --targetRoot <path>        Path to target directory where *.json schema files will be generated.
    --typeNamePrefix [prefix]  Specifies type name prefix which is not included in file names. Only used when file doesn't contain jsdoc comments specifying generation options.
    --typeNameSuffix [suffix]  Specifies type name suffix which is not included in file names. Only used when file doesn't contain jsdoc comments specifying generation options.
    --defaultProps             Create default properties definitions.
    --required                 Create required array for non-optional properties.
    --strictNullChecks         Make values non-nullable by default.
    --watch                    Re-generate Json schema file on change to TypeScript file.
    --verbose                  Show info for each generated file.
```

Example:

```
typescript-json-schema-watch 
    --tsconfig tsconfig.json
    --srcRoot /my/src
    --srcFilePattern **/*.dto.ts
    --targetRoot /my/dist
    --watch
```

This will watch for for changes made to any *.dto.ts file in all subdirectories of /my/src.

JSON schema file generation will be governed by the following rules:

1. If the file contains interfaces which have a jsdoc comment with tag `@generatejsonschema` then JSON schema will be 
generated for this type with the filename specified by the value after the jsdoc tag.

i.e. in product.dto.ts
```
/**
 * @generatejsonschema product.schema.json
 */
export interface Product {
    name: string;
    price: number;
}
```

2. Otherwise (when there are no generation options found via jsdoc comments) a single corresponding JSON schema will be
generated with filename *.dto.json. Files must contain at least one type named after the file, e.g. `mySchema.dto.ts` must
declare interface `MySchema`.

Generated schema files will be placed into corresponding directory under /my/dist root (/my/dist directory structure will mirror that of /my/src).

Note: YousefED/typescript-json-schema uses its private version of TypeScript compiler. Keep the TypeScript interface
simple to avoid problems with language features which are not supported in newer versions of TypeScript compiler.