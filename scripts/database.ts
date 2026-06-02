import { world } from '@minecraft/server';

export class Database<T extends DataTypes = any> {
	readonly id: string;

	constructor(id: string) {
		this.id = id;
	}

	getData(): T | undefined {
		return undefined;
	}

	setData(data: T) {

	}
}

export type DataTypes =
  | boolean
  | number
  | string
  | Record<string, any>
  | DataTypes[]
  | undefined