export function parseRichJson(json: string | object): any;
export function isResolved(obj: any): boolean;

export function addClassMapping(name: string, clazz: any): void;
export function addClassMappings(mappings: Record<string, any>): void;

export function addRichJsonEnv(name: string, value: any): void;
export function addRichJsonEnvs(envs: Record<string, any>): void;

export function updateConfiguration(config: object): void;
export const __RICH_JSON_CONFIG: any;

export class RichJsonModule {
    constructor(name: string);
}
export function registerRichJsonModule(module: RichJsonModule): void;
export function includeRichJsonModule(name: string): void;
export function excludeRichJsonModule(name: string): void;
export function unregisterRichJsonModule(name: string): void;

export function readRichJsonFile(path: string): Promise<any>;
export function readRichJsonDirectory(path: string): Promise<any[]>;

export function mergeObjects(target: object, ...sources: object[]): object;
export function cloneObject<T>(obj: T): T;
export function isJsonObject(obj: any): boolean;
export function resolveAddress(obj: any, address: string): any;
