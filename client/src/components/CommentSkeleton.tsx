import React from 'react';

const CommentSkeleton: React.FC = () => {
    return (
        <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            <div className="flex-1 space-y-2">
                <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
            </div>
        </div>
    );
};

export default CommentSkeleton;