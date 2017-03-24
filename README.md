This is a simple wrapper around the excellent https://github.com/YousefED/typescript-json-schema
The primary purpose of this tool is to use TypeScript interfaces as a mean to specify schema for RESTful API. 

Example of this CLI:

```
typescript-json-schema-watch --tsconfig tsconfig.json
    --srcRoot /my/src
    --srcFilePattern **/*.dto.ts
    --targetRoot /my/dist
    --required
    --watch
    --verbose
```

This will watch for for changes made to any *.dto.ts file in all subdirectories of /my/src.
When files are found to be modified corresponding *.dto.json files will be generated into
corresponding directory under /my/dist root (/my/dist directory structure will mirror that of /my/src).
Files must contain at least one type named after the file, e.g. mySchema.dto.ts must declare interface MySchema.
This type is converted into JSON schema along with any types it references.

Note: YousefED/typescript-json-schema uses its private version of TypeScript compiler. Keep the TypeScript interface
simple to avoid problems with language features which are not supported in newer versions of TypeScript compiler.