declare const yargs: any;
declare const fs: any;
declare const path: any;
declare const os: any;
declare const argv: any;
declare function scandir(directory: string): any;
declare const runRegex: RegExp;
declare const percentileRegex: RegExp;
declare function getRunResultFiles(nodes: string[]): string[];
interface PercentileData {
    nodes: number;
    percentile: number;
    delay: number;
}
declare function parseFile(location: string): PercentileData[];
declare function parseFiles(locations: string[]): PercentileData[];
declare function toCSV(data: PercentileData[]): string;
declare function writeCSV(data: PercentileData[], outfile: string): void;
declare const workdir: any;
declare const outfile: any;
declare const allFiles: any;
declare const files: string[];
declare const percentiles: PercentileData[];
//# sourceMappingURL=index.d.ts.map