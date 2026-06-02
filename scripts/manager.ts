import { world } from '@minecraft/server';

export class DatabaseManager {
	private static instance: DatabaseManager;

	private constructor() {}

	static getInstance(): DatabaseManager {
		if(!DatabaseManager.instance) {
			DatabaseManager.instance = new DatabaseManager();
		}

		return DatabaseManager.instance;
	}

	getDatabase() {

	}
}

export const databaseManager = DatabaseManager.getInstance();