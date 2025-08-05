import React from 'react';
import { useParams } from 'react-router-dom';

const PostDetailsPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();

  return (
    <div>
      <h1>Post Details</h1>
      <p>Post ID: {postId}</p>
    </div>
  );
};

export default PostDetailsPage;
