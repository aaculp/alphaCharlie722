/**
 * Mock Supabase Client for Testing
 * 
 * This mock provides a complete Supabase client that can be used in tests.
 * It returns proper response objects with { data, error } structure.
 */

// In-memory storage for test data
const mockDatabase: Record<string, any[]> = {
  profiles: [],
  friendships: [],
  friend_requests: [],
  follows: [],
  collections: [],
  collection_venues: [],
  venue_shares: [],
  activity_feed: [],
  privacy_settings: [],
  social_notifications: [],
  blocked_users: [],
  venues: [],
  checkins: [],
};

// Helper to generate IDs
let idCounter = 0;
const generateId = () => `mock-id-${++idCounter}`;

// Helper to clone data
const clone = (obj: any) => JSON.parse(JSON.stringify(obj));

// Query builder that maintains state
class MockQueryBuilder {
  private table: string;
  private operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private selectColumns = '*';
  private shouldSelect = false; // Track if select() was called after insert/update/delete
  private filters: Array<{ type: string; column: string; value: any }> = [];
  private orderBy: { column: string; ascending: boolean } | null = null;
  private limitValue: number | null = null;
  private rangeValue: { from: number; to: number } | null = null;
  private insertData: any[] = [];
  private updateData: any = {};
  private shouldReturnSingle = false;
  private shouldReturnMaybeSingle = false;

  constructor(table: string) {
    this.table = table;
    if (!mockDatabase[table]) {
      mockDatabase[table] = [];
    }
  }

  select(columns: string = '*', options?: any) {
    // If called after insert/update/delete, mark that we want to return the affected rows
    if (this.operation !== 'select') {
      this.shouldSelect = true;
      this.selectColumns = columns;
    } else {
      this.operation = 'select';
      this.selectColumns = columns;
    }
    return this;
  }

  // Helper to resolve joins in select columns
  private resolveJoins(data: any[]): any[] {
    // Check if selectColumns contains joins (e.g., "venue_id, order, venues(*)")
    if (this.selectColumns === '*' || !this.selectColumns.includes('(')) {
      return data;
    }

    // Parse the select columns to find joins
    const columns = this.selectColumns.split(',').map(c => c.trim());
    const joins: Array<{ column: string; table: string; fields: string }> = [];
    const regularColumns: string[] = [];

    for (const col of columns) {
      const joinMatch = col.match(/^(\w+)\(([^)]*)\)$/);
      if (joinMatch) {
        joins.push({
          column: joinMatch[1],
          table: joinMatch[1],
          fields: joinMatch[2] || '*',
        });
      } else {
        regularColumns.push(col);
      }
    }

    // If no joins, return as is
    if (joins.length === 0) {
      return data;
    }

    // Resolve joins for each row
    return data.map(row => {
      const result: any = {};

      // Add regular columns
      if (regularColumns.length > 0) {
        for (const col of regularColumns) {
          if (col in row) {
            result[col] = row[col];
          }
        }
      } else {
        // If no regular columns specified, include all
        Object.assign(result, row);
      }

      // Resolve each join
      for (const join of joins) {
        const foreignKey = `${join.table.slice(0, -1)}_id`; // e.g., venues -> venue_id
        const foreignId = row[foreignKey];

        if (foreignId && mockDatabase[join.table]) {
          const joinedRow = mockDatabase[join.table].find((r: any) => r.id === foreignId);
          result[join.column] = joinedRow ? clone(joinedRow) : null;
        } else {
          result[join.column] = null;
        }
      }

      return result;
    });
  }

  insert(data: any | any[]) {
    this.operation = 'insert';
    this.insertData = Array.isArray(data) ? data : [data];
    return this;
  }

  update(data: any) {
    this.operation = 'update';
    this.updateData = data;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  upsert(data: any | any[]) {
    this.operation = 'upsert';
    this.insertData = Array.isArray(data) ? data : [data];
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ type: 'neq', column, value });
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push({ type: 'gt', column, value });
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push({ type: 'gte', column, value });
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push({ type: 'lt', column, value });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push({ type: 'lte', column, value });
    return this;
  }

  like(column: string, pattern: any) {
    this.filters.push({ type: 'like', column, value: pattern });
    return this;
  }

  ilike(column: string, pattern: any) {
    this.filters.push({ type: 'ilike', column, value: pattern });
    return this;
  }

  is(column: string, value: any) {
    this.filters.push({ type: 'is', column, value });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ type: 'in', column, value: values });
    return this;
  }

  contains(column: string, value: any) {
    this.filters.push({ type: 'contains', column, value });
    return this;
  }

  or(query: string) {
    this.filters.push({ type: 'or', column: '', value: query });
    return this;
  }

  not(column: string, operator: string, value: any) {
    this.filters.push({ type: 'not', column, value: { operator, value } });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending ?? false };
    return this;
  }

  limit(count: number) {
    this.limitValue = count;
    return this;
  }

  range(from: number, to: number) {
    this.rangeValue = { from, to };
    return this;
  }

  single() {
    this.shouldReturnSingle = true;
    return this.execute();
  }

  maybeSingle() {
    this.shouldReturnMaybeSingle = true;
    return this.execute();
  }

  // Apply filters to data
  private applyFilters(data: any[]): any[] {
    let result = [...data];

    for (const filter of this.filters) {
      switch (filter.type) {
        case 'eq':
          result = result.filter(item => item[filter.column] === filter.value);
          break;
        case 'neq':
          result = result.filter(item => item[filter.column] !== filter.value);
          break;
        case 'gt':
          result = result.filter(item => item[filter.column] > filter.value);
          break;
        case 'gte':
          result = result.filter(item => item[filter.column] >= filter.value);
          break;
        case 'lt':
          result = result.filter(item => item[filter.column] < filter.value);
          break;
        case 'lte':
          result = result.filter(item => item[filter.column] <= filter.value);
          break;
        case 'in':
          result = result.filter(item => filter.value.includes(item[filter.column]));
          break;
        case 'is':
          result = result.filter(item => item[filter.column] === filter.value);
          break;
        case 'or':
          // Simple OR implementation - parse "and(col.eq.val,col2.eq.val2),and(...)"
          // For now, just return all data (tests can override if needed)
          break;
      }
    }

    return result;
  }

  // Execute the query
  private async execute(): Promise<{ data: any; error: any; count?: number }> {
    try {
      const tableData = mockDatabase[this.table] || [];

      switch (this.operation) {
        case 'select': {
          let result = this.applyFilters(tableData);

          // Apply ordering
          if (this.orderBy) {
            result.sort((a, b) => {
              const aVal = a[this.orderBy!.column];
              const bVal = b[this.orderBy!.column];
              const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
              return this.orderBy!.ascending ? comparison : -comparison;
            });
          }

          // Apply range/limit
          if (this.rangeValue) {
            result = result.slice(this.rangeValue.from, this.rangeValue.to + 1);
          } else if (this.limitValue) {
            result = result.slice(0, this.limitValue);
          }

          // Resolve joins
          result = this.resolveJoins(result);

          // Return single or array
          if (this.shouldReturnSingle) {
            if (result.length === 0) {
              return { data: null, error: { message: 'No rows found' } };
            }
            if (result.length > 1) {
              return { data: null, error: { message: 'Multiple rows found' } };
            }
            return { data: clone(result[0]), error: null };
          }

          if (this.shouldReturnMaybeSingle) {
            if (result.length === 0) {
              return { data: null, error: null };
            }
            if (result.length > 1) {
              return { data: null, error: { message: 'Multiple rows found' } };
            }
            return { data: clone(result[0]), error: null };
          }

          return { data: clone(result), error: null, count: result.length };
        }

        case 'insert': {
          const newRecords = this.insertData.map(item => ({
            id: item.id || generateId(),
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString(),
            ...item,
          }));

          mockDatabase[this.table].push(...newRecords);
          
          // Handle single/maybeSingle for insert
          if (this.shouldReturnSingle) {
            if (newRecords.length === 0) {
              return { data: null, error: { message: 'No rows inserted' } };
            }
            if (newRecords.length > 1) {
              return { data: null, error: { message: 'Multiple rows inserted' } };
            }
            return { data: clone(newRecords[0]), error: null };
          }

          if (this.shouldReturnMaybeSingle) {
            if (newRecords.length === 0) {
              return { data: null, error: null };
            }
            if (newRecords.length > 1) {
              return { data: null, error: { message: 'Multiple rows inserted' } };
            }
            return { data: clone(newRecords[0]), error: null };
          }
          
          return { data: clone(newRecords), error: null };
        }

        case 'upsert': {
          // Simple upsert: insert if not exists, update if exists
          const result = [];
          for (const item of this.insertData) {
            const existing = mockDatabase[this.table].find(r => r.id === item.id);
            if (existing) {
              Object.assign(existing, item, { updated_at: new Date().toISOString() });
              result.push(clone(existing));
            } else {
              const newRecord = {
                id: item.id || generateId(),
                created_at: item.created_at || new Date().toISOString(),
                updated_at: item.updated_at || new Date().toISOString(),
                ...item,
              };
              mockDatabase[this.table].push(newRecord);
              result.push(clone(newRecord));
            }
          }
          return { data: result, error: null };
        }

        case 'update': {
          const filtered = this.applyFilters(tableData);
          filtered.forEach(item => {
            Object.assign(item, this.updateData, { updated_at: new Date().toISOString() });
          });
          return { data: clone(filtered), error: null };
        }

        case 'delete': {
          const filtered = this.applyFilters(tableData);
          const ids = filtered.map(item => item.id);
          mockDatabase[this.table] = tableData.filter(item => !ids.includes(item.id));
          return { data: clone(filtered), error: null };
        }

        default:
          return { data: null, error: { message: 'Unknown operation' } };
      }
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  // Make the query builder thenable (for when no terminal method is called)
  then(resolve: any, reject?: any) {
    return this.execute().then(resolve, reject);
  }

  catch(reject: any) {
    return this.execute().catch(reject);
  }
}

// Mock Supabase client
export const supabase = {
  auth: {
    signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signUp: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  },
  from: (table: string) => new MockQueryBuilder(table),
  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
};

// Helper to reset mock database
export const resetMockDatabase = () => {
  Object.keys(mockDatabase).forEach(key => {
    mockDatabase[key] = [];
  });
  idCounter = 0;
};

// Helper to seed mock database
export const seedMockDatabase = (table: string, data: any[]) => {
  mockDatabase[table] = clone(data);
};

// Helper to get mock database state
export const getMockDatabase = (table?: string) => {
  if (table) {
    return clone(mockDatabase[table] || []);
  }
  return clone(mockDatabase);
};
