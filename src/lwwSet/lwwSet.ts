import _ from 'lodash';
import moment from 'moment';

import { Operations, Operation, OperationRecord } from './types';


export class LWWSet {
  private operations: Operations;

  constructor() {
    this.operations = {
      add: new Map([]),
      remove: new Map([]),
    }
  }

  private getKey (value: OperationRecord): string {
    if (_.isObject(value)) return JSON.stringify(value);
    return value.toString();
  }

  private getValue (key: string) : OperationRecord {
    try {
      return JSON.parse(key);
    } catch (e) {
      return key;
    }
  }

  private get defaultTimestamp (): number {
    return moment().unix();
  }

  private isLatestTimestamp (timestamp1: number, timestamp2: number): Boolean {
    return moment(timestamp1).isAfter(timestamp2);
  }

  private isLatestOperation (operation: Operation, value: OperationRecord, timestamp: number): Boolean {
    const key = this.getKey(value);

    const operationLatestTimestamp = this.operations[operation].get(key);
    if (!operationLatestTimestamp) return true;

    return this.isLatestTimestamp(timestamp, operationLatestTimestamp);
  }

  private addOperation (operation: Operation, value: OperationRecord, timestamp: number) {
    const key = this.getKey(value)
    this.operations[operation].set(key, timestamp);
  }

  private handleNewOperation (operation: Operation, value: OperationRecord, timestamp: number) {
    const newOperation = this.isLatestOperation(operation, value, timestamp);
    if (!newOperation) return;

    this.addOperation(operation, value, timestamp);
  }

  add (value: OperationRecord, timestamp = this.defaultTimestamp) {
    this.handleNewOperation(Operation.Add, value, timestamp);
  }

  remove (value: OperationRecord, timestamp = this.defaultTimestamp) {
    this.handleNewOperation(Operation.Remove, value, timestamp);
  }

  get (): OperationRecord[] {
    const values: OperationRecord[] = [];

    this.operations[Operation.Add].forEach((addTimestamp: number, key: string) => {
      const removeTimestamp = this.operations[Operation.Remove].get(key)
      if (!removeTimestamp || this.isLatestTimestamp(addTimestamp, removeTimestamp)) {
        const value = this.getValue(key);
        values.push(value);
      }
    });

    return values;
  }

  merge (lwwSet: LWWSet) {
    lwwSet.operations[Operation.Add].forEach((timestamp, value) => {
      this.add(value, timestamp);
    });

    lwwSet.operations[Operation.Remove].forEach((timestamp, value) => {
      this.remove(value, timestamp);
    });
  }
}
