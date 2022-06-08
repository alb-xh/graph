export enum Operation {
  Add = 'add',
  Remove = 'remove',
};

export type Operations = {
  [Operation.Add]: Map<string, number>,
  [Operation.Remove]: Map<string, number>,
};

export type OperationRecord = string | number | Object;
