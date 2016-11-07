declare module 'object-path-immutable' {
  export function set(target: Object, path: string, value: any): Object;

  export function push(target: Object, path: string, value: any): Object;

  export function del(target: Object, path: string): Object;

  export function assign(target: Object, path: string, source: Object): Object;
}
