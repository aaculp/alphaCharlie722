import { getDisplayName } from '../displayName';

describe('getDisplayName', () => {
  it('should return display_name when it exists', () => {
    const user = {
      display_name: 'John Doe',
      username: 'johndoe',
      name: 'John',
    };
    expect(getDisplayName(user)).toBe('John Doe');
  });

  it('should return username when display_name is null', () => {
    const user = {
      display_name: null,
      username: 'johndoe',
      name: 'John',
    };
    expect(getDisplayName(user)).toBe('johndoe');
  });

  it('should return name when both display_name and username are null', () => {
    const user = {
      display_name: null,
      username: null,
      name: 'John',
    };
    expect(getDisplayName(user)).toBe('John');
  });

  it('should return "Anonymous" when all fields are null', () => {
    const user = {
      display_name: null,
      username: null,
      name: null,
    };
    expect(getDisplayName(user)).toBe('Anonymous');
  });

  it('should handle empty strings as falsy', () => {
    const user = {
      display_name: '',
      username: 'johndoe',
      name: 'John',
    };
    expect(getDisplayName(user)).toBe('johndoe');
  });
});
