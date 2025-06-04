export const getUserById = (id: string) => {
  if (id === '1') return { id: 1, name: 'Alice' };
  throw new Error('User not found');
};