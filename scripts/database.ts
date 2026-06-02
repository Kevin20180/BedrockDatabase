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

	get isValid(): boolean {
		return this.header.isValid;
	}

	get isOpen(): boolean {
		return this._isOpen;
	}
	
	open() {
		if(!this.isValid) throw Error('This database is invalid.');
		if(this.isOpen) return;

		this._isOpen = true;
		try {
			this.header.getData();
		} catch(e) {
			this.close();
			throw e;
		}
	}

	close() {
		this._isOpen = false;
		this.save();
		this._cachedData = undefined;
		this._cachedHeaderData = undefined;
	}
	
	_getDataSync(): T | undefined {
		if(!this.isValid) throw Error('This database is invalid.');

		let dataType = this.header.dataType;

		if(['boolean', 'number'].includes(dataType)) {
			return world.getDynamicProperty('[db][data][0]' + this.id) as T;
		}
		else if(dataType === 'string' || dataType === 'object') {
			let rawData = '';
			let chunks = this.header.chunks;

			for(let i = 0; i < chunks; i++) {
				let chunkData = world.getDynamicProperty(`[db][data][${i}]${this.id}`);
				if(chunkData === undefined) throw Error(`Unable to read chunk ${i}.`);
				rawData += chunkData;
			}

			if(dataType === 'string') {
				return rawData as T;
			} else {
				return JSON.parse(rawData) as T;
			}
		}
		else {
			return undefined;
		}
	}

	_setDataSync(data: DataTypes) {

	}

	getData(): T | undefined {
		if(!this.isValid) throw Error('This database is invalid.');
		if(!this.isOpen) throw Error('The database is closed.');
		return undefined;
	}

	setData(data: T) {
		if(!this.isValid) throw Error('This database is invalid.');
		if(!this.isOpen) throw Error('The database is closed.');
	}

	save() {
		if(!this.isValid) throw Error('This database is invalid.');
		if(!this._cachedData) return;
		this._setDataSync(this._cachedData);
	}
}

export type DataTypes =
  | boolean
  | number
  | string
  | Record<string, any>
  | DataTypes[]
  | undefined

export type PrimitiveDataTypes = 'boolean' | 'number' | 'string' | 'object' | 'undefined';