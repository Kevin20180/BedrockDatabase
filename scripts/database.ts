import { world } from '@minecraft/server';
import { DatabaseHeader, type DatabaseHeaderData } from './header';

export class Database<T extends DataTypes = DataTypes> {
	readonly id: string;
	readonly header: DatabaseHeader;
	_isOpen: boolean;
	_cachedData?: T | null;
	_cachedHeaderData?: DatabaseHeaderData | null;
	_modified: boolean;

	constructor(id: string) {
		this.id = id;
		this._isOpen = false;
		this.header = new DatabaseHeader(this, this.id);
		this._modified = false;
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

		this.getData();
	}

	close() {
		this._isOpen = false;
		this.save();
		this._cachedData = null;
		this._cachedHeaderData = null;
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

	_setDataSync(data: T) {
		if(!this.isValid) throw Error('This database is invalid.');

		let dataType = typeof data;

		if(data === null || ['boolean', 'number', 'undefined'].includes(dataType)) {
			let chunks = this.header.chunks;

			if(chunks > 1) {
				for(let i = 1; i < chunks; i++) {
					world.setDynamicProperty(`[db][data][${i}]${this.id}`);
				}
				this.header.chunks = 1;
			}

			world.setDynamicProperty('[db][data][0]' + this.id, data as boolean | number | undefined);
		}
		else if(['string', 'object'].includes(dataType)) {
			let rawData: string;
			if(dataType === 'object') rawData = JSON.stringify(data)
			else rawData = data as string;

			let oldChunks = this.header.chunks;
			let chunks = Math.ceil(rawData.length / 32767);
			console.log('chunks', chunks)

			if(oldChunks > chunks) {
				for(let i = chunks; i < oldChunks; i++) {
					world.setDynamicProperty(`[db][data][${i}]${this.id}`);
				}
			}

			for(let i = 0; i < chunks; i++) {
				world.setDynamicProperty(`[db][data][${i}]${this.id}`, rawData.slice(0, 32767));
				rawData = rawData.slice(32767);
			}

			this.header.chunks = chunks;
		}
		else {
			throw TypeError("Argument 'data' must be of type DataTypes.");
		}

		this.header.dataType = dataType as PrimitiveDataTypes;
		this.header.updatedAt = new Date();

		if(dataType === 'object') this._cachedData = { ...data as Record<string, any> } as T;
		else this._cachedData = data;
	}

	getData(): T | undefined {
		if(!this.isValid) throw Error('This database is invalid.');
		if(!this.isOpen) throw Error('The database is closed.');
		
		let data = this._cachedData;
		if(data) return data;

		data = this._getDataSync();
		this._cachedData = data;

		if(typeof data === 'object') return { ...data }
		else return data;
	}

	setData(data: T) {
		if(!this.isValid) throw Error('This database is invalid.');
		if(!this.isOpen) throw Error('The database is closed.');

		let dataType = typeof data;
		if(dataType === 'object') this._cachedData = { ...data as Record<string, any> } as T;
		else this._cachedData = data;

		this.header.dataType = dataType as PrimitiveDataTypes;
		this.header.updatedAt = new Date();

		this._modified = true;
	}

	save() {
		if(!this.isValid) throw Error('This database is invalid.');
		
		this.header.save();
		if(!this._modified) return;
		
		if(this._cachedData === null) return;
		else this._setDataSync(this._cachedData as T);
		
		this._modified = false;
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