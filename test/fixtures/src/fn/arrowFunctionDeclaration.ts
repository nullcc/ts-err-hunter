type Fn = ((...args: any[]) => Promise<any>) | ((...args: any[]) => any);

export const add = (x: number, y: number): number => {
  return x + y;
};

export const exec = async (fn: Fn): Promise<any> => {
  return await fn();
};