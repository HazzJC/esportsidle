/**
 * The little bit of Node the scripts use. The app itself never touches these, so the project does
 * not carry @types/node just for the balance sim.
 */
declare module 'node:fs' {
  export function writeFileSync(path: string, data: string): void;
  export function readFileSync(path: string, encoding: 'utf8'): string;
  export function readdirSync(path: string): string[];
  export function mkdirSync(path: string, options?: { recursive?: boolean }): void;
}
