import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('contacts.db');

export interface Contact {
    id?: number;
    name: string;
    title: string;
    company: string;
    phone: string;
    mobile_phone: string;
    email: string;
    address: string;
    website: string;
    image_data: string;
    suggested_rotation?: number;
    created_at?: string;
}

export const initDB = () => {
    db.execSync(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      title TEXT,
      company TEXT,
      phone TEXT,
      mobile_phone TEXT,
      email TEXT,
      address TEXT,
      website TEXT,
      image_data TEXT,
      suggested_rotation INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

    // Try to add column if it doesn't exist (primitive migration)
    try {
        db.execSync(`ALTER TABLE contacts ADD COLUMN suggested_rotation INTEGER DEFAULT 0;`);
    } catch (e) { }
    try {
        db.execSync(`ALTER TABLE contacts ADD COLUMN mobile_phone TEXT DEFAULT '';`);
    } catch (e) { }
};

export const addContact = async (contact: Contact): Promise<number> => {
    const result = await db.runAsync(
        `INSERT INTO contacts (name, title, company, phone, mobile_phone, email, address, website, image_data, suggested_rotation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            contact.name,
            contact.title,
            contact.company,
            contact.phone,
            contact.mobile_phone || '',
            contact.email,
            contact.address,
            contact.website,
            contact.image_data,
            contact.suggested_rotation ?? 0,
        ]
    );
    return result.lastInsertRowId;
};

export const updateContact = async (contact: Contact): Promise<void> => {
    await db.runAsync(
        `UPDATE contacts SET name=?, title=?, company=?, phone=?, mobile_phone=?, email=?, address=?, website=?, suggested_rotation=? WHERE id=?`,
        [
            contact.name,
            contact.title,
            contact.company,
            contact.phone,
            contact.mobile_phone,
            contact.email,
            contact.address,
            contact.website,
            contact.suggested_rotation ?? 0,
            contact.id
        ]
    );
};

export const getContacts = async (): Promise<Contact[]> => {
    const allRows = await db.getAllAsync<Contact>(
        `SELECT * FROM contacts ORDER BY created_at DESC`
    );
    return allRows;
};

export const checkDuplicate = async (name: string): Promise<boolean> => {
    const result = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM contacts WHERE name = ?`,
        [name]
    );
    return (result?.count ?? 0) > 0;
};

export const deleteContact = async (id: number): Promise<void> => {
    await db.runAsync(`DELETE FROM contacts WHERE id = ?`, [id]);
};

