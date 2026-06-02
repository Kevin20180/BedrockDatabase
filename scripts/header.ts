import { world } from '@minecraft/server';
import { Database, type PrimitiveDataTypes } from './database';

export class DatabaseHeader {
	readonly database: Database;
	readonly id: string;
	readonly rawId: string;
	
	constructor(db: Database, id: string) {
		this.database = db;
		this.id = id;
		this.rawId = `[db][header]${id}`;
	}
	
	get isValid(): boolean {
		if(this.database._cachedHeaderData) return true;
		return Boolean(world.getDynamicProperty(this.rawId));
	}
	
	getData(): DatabaseHeaderData {
		if(this.database.isOpen && this.database._cachedHeaderData) {
			return { ...this.database._cachedData };
		}

		let rawData = world.getDynamicProperty(this.rawId);
		if(!rawData) throw Error("This database header is invalid.");

		if(typeof rawData !== 'string') throw TypeError('Invalid header data.');
		
		let data = JSON.parse(rawData);
		if(typeof data !== 'object') throw TypeError('Invalid header data.');

		if(data.id !== 'string') data.id = this.id;
		if(data.createdAt !== 'string') throw TypeError("Invalid type of property 'created_at' in the header data.");
		if(data.updated_at !== 'string') throw TypeError("Invalid type of property 'updated_at' in the header data.");
		if(data.chunks !== 'number') throw TypeError("Invalid type of property 'chunks' in the header data.");
		if(data.data_type === null || !['boolean', 'number', 'string', 'object'].includes(data.data_type)) throw TypeError("Invalid type of property 'data_type' in the header data.");

		if(this.database.isOpen) this.database._cachedHeaderData = data;

		return { ...data }
	}

	setData(data: DatabaseHeaderData) {
		if(typeof data !== 'object') throw TypeError("Argument 'data' must be of type HeaderData.");
		if(!this.isValid) throw Error("This database header is invalid.");

		if(this.database.isOpen) this.database._cachedHeaderData = { ...data }
		world.setDynamicProperty(JSON.stringify(data));
	}

	get createdAt(): Date {
		return new Date(this.getData().created_at);
	}

	get updatedAt(): Date {
		return new Date(this.getData().updated_at);
	}
	set updatedAt(date: Date) {
		const data = this.getData();
		data.updated_at = date.toJSON();
		this.setData(data);
	}

	get chunks(): number {
		return this.getData().chunks;
	}
	set chunks(a: number) {
		const data = this.getData();
		data.chunks = a;
		this.setData(data);
	}

	get dataType(): PrimitiveDataTypes {
		return this.getData().data_type;
	}
	set dataType(a: PrimitiveDataTypes) {
		const data = this.getData();
		data.data_type = a;
		this.setData(data);
	}
}

export interface DatabaseHeaderData {
	id: string,
	created_at: string,
	updated_at: string,
	chunks: number,
	data_type: "boolean" | "number" | "string" | "object"
}
