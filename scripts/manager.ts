import { world, system } from '@minecraft/server';
import { Database } from './database';
import type { DatabaseHeaderData } from './header';

export class DatabaseManager {
	private static instance: DatabaseManager;
	_cachedDatabasesById: Map<string, Database>;

	private constructor() {
		this._cachedDatabasesById = new Map();
	}

	static getInstance(): DatabaseManager {
		if(!DatabaseManager.instance) {
			DatabaseManager.instance = new DatabaseManager();
		}

		return DatabaseManager.instance;
	}

	getDatabase(id: string): Database | undefined {
		let db = this._cachedDatabasesById.get(id);
		if(db) {
			if(db.isValid) return db
			else return;
		}

		db = new Database(id);
		if(!db.isValid) return;

		this._cachedDatabasesById.set(id, db);
		db.open();
		return db;
	}

	getOrCreateDatabase(id: string): Database {
		let db = this.getDatabase(id);
		if(db) return db;

		const date = new Date();
		let dateJson = date.toJSON();

		const headerData: DatabaseHeaderData = {
			id,
			created_at: dateJson,
			updated_at: dateJson,
			chunks: 0,
			data_type: 'undefined'
		}
		
		world.setDynamicProperty('[db][header]' + id, JSON.stringify(headerData));

		db = new Database(id);
		this._cachedDatabasesById.set(id, db);

		db.open();
		return db;
	}
}

export const databaseManager = DatabaseManager.getInstance();

system.runInterval(() => {
	for(const db of databaseManager._cachedDatabasesById.values()) {
		try {
			db.save();
		} catch(e) {
			console.error(`Unsaved database '${db.id}':`, e);
		}
	}
}, 200)

system.beforeEvents.shutdown.subscribe((event) => {
	for(const db of databaseManager._cachedDatabasesById.values()) {
		try {
			db.save();
		} catch(e) {
			console.error(`Unsaved database '${db.id}':`, e);
		}
	}
})