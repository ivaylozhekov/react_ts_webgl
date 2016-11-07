// custom_typings/react-waypoint.d.ts
interface Waypoint {
  new()
}

declare const Waypoint: Waypoint

declare module "react-waypoint" {
  export = Waypoint
}
