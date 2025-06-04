// tests/services/UserService.test.ts
import { getUserById } from '../../src/services/auth.service';

describe('getUserById', () => {
  it('returns user for id 1', () => {
    expect(getUserById('1')).toEqual({ id: 1, name: 'Alice' });
  });

  it('throws error for unknown id', () => {
    expect(() => getUserById('999')).toThrow('User not found');
  });
});