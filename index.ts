import * as TJS from "typescript-json-schema";
import * as globLib from "glob";
import * as args from "commander";
import * as ts from "typescript";
import * as fs from "fs-promise";
import * as path from "path";
import * as mkdirp from "mkdirp";
import * as chokidar from "chokidar";

let watcher: chokidar.FSWatcher = null;

args.version("0.1.9")
    .usage("[options]")
    .option("--tsconfig <path>", "Path to tsconfig.json.")
    .option("--srcRoot <path>", "Path to root directory with TypeScript files.") 
    .option("--srcFilePattern <glob>", "E.g. **/*.schema.ts - specifies which TypeScript files to process. This is relative to --srcRoot.") 
    .option("--targetRoot <path>", "Path to target directory where *.json schema files will be generated.") 
    .option("--typeNamePrefix [prefix]", "Specifies type name prefix which is not included in file names.")
    .option("--typeNameSuffix [suffix]", "Specifies type name suffix which is not included in file names.")
    .option("--defaultProps", "Create default properties definitions.", false) 
    .option("--required", "Create required array for non-optional properties.", false) 
    .option("--strictNullChecks", "Make values non-nullable by default.", false) 
    .option("--watch", "Re-generate Json schema file on change to TypeScript file.", false) 
    .option("--verbose", "Show info for each generated file.", false) 
    .parse(process.argv);

validateArgumentsGiven(["tsconfig", "srcRoot", "srcFilePattern", "targetRoot"]);
run();

function validateArgumentsGiven(argumentNames: string[]) {
    argumentNames.forEach(argumentName => {
        if (!args[argumentName]) {
            console.error(`--${argumentName} is required.`);
        }
    });

    if (argumentNames.some(argumentName => !args[argumentName])) {
        console.info("Use --help to display usage.");
        process.exit(2);
    }
}

async function run() {
    const srcFilesGlob = path.join(args["srcRoot"], args["srcFilePattern"]);
    const files = await glob(srcFilesGlob);
    
    if (args["watch"]) {
        setUpWatching(srcFilesGlob, files);
    } else {
        const success = await generateManyFiles(files);
        process.exit(success ? 0 : 1);
    }
}

function setUpWatching(srcFilesGlob: string, allMatchingFiles: string[]) {
    let modifiedFiles: Set<string> = new Set(allMatchingFiles);

    watcher = chokidar.watch(srcFilesGlob, { persistent: true, awaitWriteFinish: true, usePolling: true });
    watcher.on("add", queueChange);
    watcher.on("change", queueChange);    

    function queueChange(path: string) {
        modifiedFiles.add(path.replace(new RegExp("\\\\", "g"), "/",));
        processChanges();
    }

    const debounce = require("debounce");
    const processChanges = debounce(() => {
        generateManyFiles(Array.from(modifiedFiles));
        modifiedFiles.clear();
    }, 200);

    processChanges();
}

async function generateManyFiles(sourceFilePaths: string[]): Promise<boolean> {
    if (!sourceFilePaths.length) {
      return Promise.resolve(true);
    }

    const program = programFromConfig(sourceFilePaths, args["tsconfig"]);

    const generatorSettings : TJS.PartialArgs = {
        useDefaultProperties: args["defaultProps"],
        generateRequired: args["required"],
        strictNullChecks: args["strictNullChecks"]
    };

    const generator = TJS.buildGenerator(program, generatorSettings);
    if (!generator) {
        console.error('Json schema generation has failed due to TypeScript compilation errors.')
        return Promise.resolve(false);
    }

    let numberOfSuccessful = 0;
    for (let i = 0; i < sourceFilePaths.length; i++) {
        try {
            await generateOneFile(sourceFilePaths[i], generator);
            numberOfSuccessful++;
            if (args["verbose"]) {
                console.log(`Generated Json schema for ${sourceFilePaths[i]}.`);
            }
        } catch (error) {
            console.error(`Failed to generate Json schema for ${sourceFilePaths[i]}: ${error}.`);
        }
    };

    if (!args["verbose"]) {
        console.log(`Generated Json schema for ${numberOfSuccessful} file${numberOfSuccessful > 1 ? "s" : ""} matching ${args["srcFilePattern"]}.`);
    }

    return numberOfSuccessful == sourceFilePaths.length;
}

async function generateOneFile(sourceFilePath: string, generator: TJS.JsonSchemaGenerator) {
    const sourceFileName = path.basename(sourceFilePath);
    const coreName = sourceFileName.split(".", 1)[0];
    
    let typeName = coreName.charAt(0).toUpperCase() + coreName.slice(1);
    if (args["typeNamePrefix"]) {
        typeName = args["typeNamePrefix"] + typeName;
    }
    if (args["typeNameSuffix"]) {
        typeName += args["typeNameSuffix"];
    }

    const outputFileName = sourceFileName.slice(0, sourceFileName.lastIndexOf(".")) + ".json";
    const outputDirName = path.join(args["targetRoot"], path.relative(args["srcRoot"], path.dirname(sourceFilePath)));
    const outputFilePath = path.join(outputDirName, outputFileName);

    const schemaDefinition = generator.getSchemaForSymbol(typeName);

    mkdirp.sync(outputDirName);
    await fs.writeJson(outputFilePath, schemaDefinition);
}

function programFromConfig(fileNames: string[], configFileName: string): ts.Program {
    const result = ts.parseConfigFileTextToJson(configFileName, ts.sys.readFile(configFileName));
    const configObject = result.config;
    const configParseResult = ts.parseJsonConfigFileContent(configObject, ts.sys, path.dirname(configFileName), {}, configFileName);
    const options = configParseResult.options;
    options.noEmit = true;
    options.skipLibCheck = true;
    delete options.out;
    delete options.outDir;
    delete options.outFile;
    delete options.declaration;
    return ts.createProgram(fileNames, options);
}

async function glob(pattern: string): Promise<Array<string>> {
    return new Promise<Array<string>>((resolve, reject) => {
        globLib(pattern, (error, matches) => {
            if (error) {
                reject(error);
            } else {
                resolve(matches);
            }
        })
    })
}