declare module "*.GIF" {
  import type { StaticImageData } from "next/image";
  const value: StaticImageData;
  export default value;
}

declare module "*.gif" {
  import type { StaticImageData } from "next/image";
  const value: StaticImageData;
  export default value;
}
