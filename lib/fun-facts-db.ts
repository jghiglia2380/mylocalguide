import Database from 'better-sqlite3';
import { FunFact, FunFactWithLocation } from './types/fun-facts';

export class FunFactsDB {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  getFactsByNeighborhood(neighborhoodId: number): FunFact[] {
    const stmt = this.db.prepare(`
      SELECT 
        ff.*,
        n.name as neighborhood_name,
        c.name as city_name,
        s.name as state_name
      FROM fun_facts ff
      LEFT JOIN neighborhoods n ON ff.location_id = n.id AND ff.location_type = 'neighborhood'
      LEFT JOIN cities c ON ff.city_id = c.id
      LEFT JOIN states s ON c.state_id = s.id
      WHERE (ff.location_id = ? AND ff.location_type = 'neighborhood')
         OR (ff.city_id = (SELECT city_id FROM neighborhoods WHERE id = ?) AND ff.location_type IN ('city', 'street', 'landmark', 'venue'))
      ORDER BY ff.fun_rating DESC, ff.tourist_appeal DESC
    `);
    
    const rows = stmt.all(neighborhoodId, neighborhoodId) as any[];
    return rows.map(this.mapRowToFunFact);
  }

  getFactsByCity(cityId: number): FunFact[] {
    const stmt = this.db.prepare(`
      SELECT 
        ff.*,
        n.name as neighborhood_name,
        c.name as city_name,
        s.name as state_name
      FROM fun_facts ff
      LEFT JOIN neighborhoods n ON ff.location_id = n.id AND ff.location_type = 'neighborhood'
      LEFT JOIN cities c ON ff.city_id = c.id
      LEFT JOIN states s ON c.state_id = s.id
      WHERE ff.city_id = ?
      ORDER BY ff.fun_rating DESC, ff.tourist_appeal DESC
    `);
    
    const rows = stmt.all(cityId) as any[];
    return rows.map(this.mapRowToFunFact);
  }

  getFactsByLocation(latitude: number, longitude: number, radiusKm: number = 0.5): FunFactWithLocation[] {
    // Using Haversine formula for distance calculation
    const stmt = this.db.prepare(`
      SELECT 
        ff.*,
        n.name as neighborhood_name,
        c.name as city_name,
        s.name as state_name,
        CASE 
          WHEN ff.coordinates IS NOT NULL THEN
            (6371 * acos(cos(radians(?)) * cos(radians(CAST(substr(ff.coordinates, 1, instr(ff.coordinates, ',') - 1) AS REAL))) 
            * cos(radians(CAST(substr(ff.coordinates, instr(ff.coordinates, ',') + 1) AS REAL)) - radians(?)) 
            + sin(radians(?)) * sin(radians(CAST(substr(ff.coordinates, 1, instr(ff.coordinates, ',') - 1) AS REAL)))))
          ELSE 999
        END as distance_km
      FROM fun_facts ff
      LEFT JOIN neighborhoods n ON ff.location_id = n.id AND ff.location_type = 'neighborhood'
      LEFT JOIN cities c ON ff.city_id = c.id
      LEFT JOIN states s ON c.state_id = s.id
      WHERE ff.coordinates IS NOT NULL
      HAVING distance_km <= ?
      ORDER BY distance_km ASC, ff.fun_rating DESC
      LIMIT 20
    `);
    
    const rows = stmt.all(latitude, longitude, latitude, radiusKm) as any[];
    return rows.map(row => ({
      ...this.mapRowToFunFact(row),
      distance_km: row.distance_km,
      neighborhood_name: row.neighborhood_name,
      city_name: row.city_name,
      city_slug: row.city_slug || '',
      state_name: row.state_name,
      state_code: row.state_code || '',
      state_slug: row.state_slug || ''
    }));
  }

  getFactsByCategory(category: string, cityId?: number): FunFact[] {
    let query = `
      SELECT 
        ff.*,
        n.name as neighborhood_name,
        c.name as city_name,
        s.name as state_name
      FROM fun_facts ff
      LEFT JOIN neighborhoods n ON ff.location_id = n.id AND ff.location_type = 'neighborhood'
      LEFT JOIN cities c ON ff.city_id = c.id
      LEFT JOIN states s ON c.state_id = s.id
      WHERE ff.category = ?
    `;
    
    const params: any[] = [category];
    
    if (cityId) {
      query += ' AND ff.city_id = ?';
      params.push(cityId);
    }
    
    query += ' ORDER BY ff.fun_rating DESC, ff.tourist_appeal DESC';
    
    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map(this.mapRowToFunFact);
  }

  getRandomFacts(count: number = 5, cityId?: number): FunFact[] {
    let query = `
      SELECT 
        ff.*,
        n.name as neighborhood_name,
        c.name as city_name,
        s.name as state_name
      FROM fun_facts ff
      LEFT JOIN neighborhoods n ON ff.location_id = n.id AND ff.location_type = 'neighborhood'
      LEFT JOIN cities c ON ff.city_id = c.id
      LEFT JOIN states s ON c.state_id = s.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (cityId) {
      query += ' AND ff.city_id = ?';
      params.push(cityId);
    }
    
    query += ' ORDER BY RANDOM() LIMIT ?';
    params.push(count);
    
    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map(this.mapRowToFunFact);
  }

  getLocalSecrets(cityId?: number): FunFact[] {
    let query = `
      SELECT 
        ff.*,
        n.name as neighborhood_name,
        c.name as city_name,
        s.name as state_name
      FROM fun_facts ff
      LEFT JOIN neighborhoods n ON ff.location_id = n.id AND ff.location_type = 'neighborhood'
      LEFT JOIN cities c ON ff.city_id = c.id
      LEFT JOIN states s ON c.state_id = s.id
      WHERE ff.local_knowledge = 1
    `;
    
    const params: any[] = [];
    
    if (cityId) {
      query += ' AND ff.city_id = ?';
      params.push(cityId);
    }
    
    query += ' ORDER BY ff.fun_rating DESC, ff.tourist_appeal DESC';
    
    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map(this.mapRowToFunFact);
  }

  getFunFactStats(cityId?: number): {
    total: number;
    localSecrets: number;
    verified: number;
    categories: number;
    averageFunRating: number;
  } {
    let query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN local_knowledge = 1 THEN 1 ELSE 0 END) as local_secrets,
        SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) as verified,
        COUNT(DISTINCT category) as categories,
        AVG(fun_rating) as avg_fun_rating
      FROM fun_facts
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (cityId) {
      query += ' AND city_id = ?';
      params.push(cityId);
    }
    
    const stmt = this.db.prepare(query);
    const result = stmt.get(...params) as any;
    
    return {
      total: result.total || 0,
      localSecrets: result.local_secrets || 0,
      verified: result.verified || 0,
      categories: result.categories || 0,
      averageFunRating: Math.round((result.avg_fun_rating || 0) * 10) / 10
    };
  }

  private mapRowToFunFact(row: any): FunFact {
    return {
      id: row.id,
      title: row.title,
      fact: row.fact,
      category: row.category,
      location_type: row.location_type,
      location_id: row.location_id,
      city_id: row.city_id,
      fun_rating: row.fun_rating,
      tourist_appeal: row.tourist_appeal,
      local_knowledge: row.local_knowledge === 1,
      latitude: row.latitude,
      longitude: row.longitude,
      source: row.source || row.source_type,
      verified: row.verified === 1,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}