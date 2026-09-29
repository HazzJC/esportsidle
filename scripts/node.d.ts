/**
 * The little bit of Node the scripts use. The app itself never touches these, so the project does
 * not carry @types/node just for the balance sim.
 */
declare module 'node:fs' {
  export function writeFileSync(path: string, data: string): void;
  export function readFileSync(path: string, encoding: 'utf8'): string;
  export function existsSync(path: string): boolean;
  export function readdirSync(path: string): string[];
  export function mkdirSync(path: string, options?: { recursive?: boolean }): void;
  export function rmSync(path: string, options?: { recursive?: boolean; force?: boolean }): void;
}

declare module 'node:os' {
  export function availableParallelism(): number;
}

declare module 'node:child_process' {
  interface Readable {
    on(event: 'data', listener: (chunk: { toString(): string }) => void): void;
  }
  export interface ChildProcess {
    stdout: Readable | null;
    stderr: Readable | null;
    on(event: 'exit', listener: (code: number | null) => void): void;
  }
  export function spawn(command: string, args: string[], options?: { cwd?: string; stdio?: unknown }): ChildProcess;
  export function execSync(command: string, options?: { encoding: 'utf8' }): string;
}
