import zxcvbn from 'zxcvbn';

export function getPasswordStrength(password: string) {
  const result = zxcvbn(password);
  const score = result.score;
  const strengthLevels = [
    { label: 'Common', color: 'bg-red-500' },
    { label: 'Uncommon', color: 'bg-orange-500' },
    { label: 'Rare', color: 'bg-yellow-500' },
    { label: 'Epic', color: 'bg-lime-500' },
    { label: 'Legendary', color: 'bg-green-500' },
  ];
  return strengthLevels[score] || { label: 'Unknown', color: 'bg-gray-500' };
}

export function getCrackTime(password: string) {
  const result = zxcvbn(password);
  return result.crack_times_display.offline_slow_hashing_1e4_per_second;
}

export function customPasswordStrength(password: string) {
  // at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  return regex.test(password); // boolean
}

export default function PswStrength({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  return (
    <div className='flex items-center gap-2'>
      <div className={`h-2 w-16 rounded ${strength.color}`} />
      <span className='text-sm'>{strength.label}</span>
      <span className='text-xs text-gray-500'>
        Can be cracked in {getCrackTime(password)}
      </span>
    </div>
  );
}
