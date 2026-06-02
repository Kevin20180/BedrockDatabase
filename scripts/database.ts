import { world } from '@minecraft/server';
import { DatabaseHeader, type DatabaseHeaderData } from './header';

export class Database<T extends DataTypes = any> {
	readonly id: string;
	readonly header: DatabaseHeader;
	_isOpen: boolean;
	_cachedData: T | undefined;
	_cachedHeaderData: DatabaseHeaderData | undefined;

	constructor(id: string) {
		this.id = id;
		this._isOpen = false;
		this.header = new DatabaseHeader(this, this.id);
	}

	get isOpen(): boolean {
		return this._isOpen;
	}
	
	open() {
		if(this.isOpen) return;
		this._isOpen = true;
		try {
			this.header.getData();
		} catch {
			this.close();
		}
	}

	close() {
		this._isOpen = false;
		this.save();
		this._cachedData = undefined;
		this._cachedHeaderData = undefined;
	}
	
	getDataSync(): T | undefined {
		if(!this.isOpen) throw Error('The database is closed.');
		const headerData = this.header.getData();
		return;
	}

	getData(): T | undefined {
		if(!this.isOpen) throw Error('The database is closed.');
		return undefined;
	}

	setData(data: T) {
		if(!this.isOpen) throw Error('The database is closed.');
	}

	save() {

	}
}

export type DataTypes =
  | boolean
  | number
  | string
  | Record<string, any>
  | DataTypes[]
  | undefined

export type PrimitiveDataTypes = 'boolean' | 'number' | 'string' | 'object';