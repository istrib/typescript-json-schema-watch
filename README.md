This is a simple wrapper around the excellent https://github.com/YousefED/typescript-json-schema
The primary purpose of this tool is to use TypeScript interfaces as schema specification for RESTful API messages. 

```
  Usage: typescript-json-schema-watch [options]

  Options:

    -h, --help               output usage information
    -V, --version            output the version number
    --tsconfig <path>        Path to tsconfig.json.
    --srcRoot <path>         Path to root directory with TypeScript files.
    --srcFilePattern <glob>  E.g. **/*.schema.ts - specifies which TypeScript files to process. 
                             This is relative to --srcRoot.
    --targetRoot <path>      Path to target directory where *.json schema files will be generated.
    --defaultProps           Create default properties definitions.
    --required               Create required array for non-optional properties.
    --strictNullChecks       Make values non-nullable by default.
    --watch                  Re-generate Json schema file on change to TypeScript file.
    --verbose                Show info for each generated file.
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
When files are found to be modified corresponding *.dto.json files will be generated into
corresponding directory under /my/dist root (/my/dist directory structure will mirror that of /my/src).
Files must contain at least one type named after the file, e.g. mySchema.dto.ts must declare interface MySchema.
This type is converted into JSON schema along with any types it references.

Note: YousefED/typescript-json-schema uses its private version of TypeScript compiler. Keep the TypeScript interface
simple to avoid problems with language features which are not supported in newer versions of TypeScript compiler.