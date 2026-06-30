import { getR2PublicURL } from "./getStorageURL";

export const chunking = <T>(array: Array<T>, size: number) => {
  const chunks: T[][] = [];

  for (let i=0; i<array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }

  return chunks;
}

export const getFullImageUrl = (value: string) => {
  if (!value) {
    return;
  }

  return `${getR2PublicURL()}/${value}`;
};