export function parse(json: string | object): any;
export function isResolved(obj: any): boolean;

export function addClassMapping(name: string, clazz: any): void;
export function addClassMappings(mappings: Record<string, any>): void;

export function addEnvironmentVariable(name: string, value: any): void;
export function addEnvironmentVariables(envs: Record<string, any>): void;

export function updateConfiguration(config: object): void;
export const __RICH_JSON_CONFIG: any;

export class RichJsonModule {
    constructor(name: string);
}
export function registerModule(module: RichJsonModule): void;
export function includeModule(name: string): void;
export function excludeModule(name: string): void;
export function unregisterModule(name: string): void;

export function readFile(path: string): Promise<any>;
export function readDirectory(path: string): Promise<any[]>;

export function mergeObjects(target: object, ...sources: object[]): object;
export function cloneObject<T>(obj: T): T;
export function isJsonObject(obj: any): boolean;
export function resolveAddress(obj: any, address: string): any;

export function keepKeyCommands(obj: any): any;