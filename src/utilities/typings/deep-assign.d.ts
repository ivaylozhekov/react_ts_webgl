declare module 'deep-assign' {
  function assign<A extends Object>(a: A): A;
  function assign<A extends Object, B>(a: A, b: B): A & B;
  function assign<A extends Object, B, C>(a: A, b: B, c: C): A & B & C;
  function assign<A extends Object, B, C, D>(a: A, b: B, c: C, d: D): A & B & C & D;
  function assign<A extends Object, B, C, D, E>(a: A, b: B, c: C, d: D, e: E): A & B & C & D & E;
  function assign<A extends Object>(...a: A[]): A;

  export = assign;
}
