import type { IPerson } from '@/types/discovery';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users, UserPlus } from 'lucide-react';

interface PersonItemProps {
  person: IPerson;
}

const PersonItem: React.FC<PersonItemProps> = ({ person }) => {
  return (
    <Card className='w-full'>
      <CardHeader className='pb-3'>
        <div className='flex items-center gap-3'>
          <Avatar className='h-12 w-12'>
            <AvatarImage
              src={person.avatarUrl}
              alt={person.displayName || person.username}
            />
            <AvatarFallback>
              {(person.displayName || person.username).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-1'>
              <span className='font-semibold'>
                {person.displayName || person.username}
              </span>
              <span className='text-muted-foreground text-sm'>
                @{person.username}
              </span>
            </div>
            <div className='flex items-center gap-4 text-sm text-muted-foreground'>
              <div className='flex items-center gap-1'>
                <Users className='h-3 w-3' />
                <span>{person.followerCount} followers</span>
              </div>
              <div className='flex items-center gap-1'>
                <UserPlus className='h-3 w-3' />
                <span>{person.followingCount} following</span>
              </div>
            </div>
          </div>
          <Button variant='outline' size='sm' className='ml-auto'>
            Follow
          </Button>
        </div>
      </CardHeader>
      {person.bio && (
        <CardContent className='pt-0'>
          <p className='text-muted-foreground text-sm'>{person.bio}</p>
        </CardContent>
      )}
    </Card>
  );
};

export default PersonItem;
