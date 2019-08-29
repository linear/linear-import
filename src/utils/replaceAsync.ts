/**
 * String replace with async function.
 */
export const replaceAsync = async (
  str: string,
  regex: RegExp,
  asyncFn: (match: any) => Promise<string>
) => {
  const promises: Promise<string>[] = [];
  // @ts-ignore
  str.replace(regex, (match, ...args) => {
    // @ts-ignore
    const promise = asyncFn(match, ...args);
    promises.push(promise);
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift() as string);
};
