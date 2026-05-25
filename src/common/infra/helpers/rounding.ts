export const RoundToTwo = (num: number): number => {
  return +(Math.round(Number(num + 'e+2')) + 'e-2');
};
