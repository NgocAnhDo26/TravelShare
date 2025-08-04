import React, { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import API from '@/utils/axiosInstance';
import CommentItem, { type IComment } from './CommentItem';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Loader2, ImagePlus, X } from 'lucide-react';
import type { FormEvent } from 'react';
import type { AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import './Comment.css';
import { Textarea } from './ui/textarea';

interface AuthUser {
    _id: string; userId?: string; username: string; displayName?: string; avatarUrl?: string;
}

interface ReplyInputProps {
    user: AuthUser | null | undefined;
    onSubmit: (content: string, imageFile: File | null) => Promise<void>;
    initialContent?: string;
}

const ReplyInput: React.FC<ReplyInputProps> = ({ user, onSubmit, initialContent }) => {
    const [replyContent, setReplyContent] = useState(initialContent || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setReplyContent(initialContent || '');
    }, [initialContent]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if ((!replyContent.trim() && !imageFile) || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onSubmit(replyContent, imageFile);
            setReplyContent('');
            removeImage();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col items-start gap-2 w-full">
            <form className="flex items-start gap-3 w-full" onSubmit={handleSubmit}>
                <Avatar className="w-9 h-9">
                    <AvatarImage src={user?.avatarUrl || ''} alt={user?.username} />
                    <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase() || user?.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className='flex-1 flex flex-col'>
                    <div className='relative w-full'>
                        <Textarea
                            autoFocus
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="min-h-[36px] max-h-[120px] resize-none pr-10 break-all"
                            rows={1}
                            disabled={isSubmitting}
                        />
                        <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                        <Button type="button" size="icon" variant="ghost" className="absolute right-1 top-1 h-8 w-8" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
                            <ImagePlus className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </form>
            {imagePreview && (
                <div className="relative w-fit self-start ml-12 mt-2">
                    <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg" />
                    <button type="button" onClick={removeImage} className="absolute top-1 right-1 bg-gray-900/50 text-white rounded-full p-1 hover:bg-gray-900/80">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
            <div className='flex items-center gap-2 ml-12'>
                <Button
                    type="button"
                    size="sm"
                    onClick={handleSubmit}
                    disabled={isSubmitting || (!replyContent.trim() && !imageFile)}
                >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reply'}
                </Button>
            </div>
        </div>
    );
};


interface ThreadProps {
    comment: IComment;
    currentUser?: AuthUser | null;
    likedCommentIds: Set<string>;
    hiddenCommentIds: Set<string>;
    onLike: (commentId: string) => void;
    onDelete: (commentId: string, parentId: string | null) => Promise<boolean>;
    onEdit: (commentId: string, newContent: string) => Promise<void>;
    onHide: (commentId: string) => void;
    onAddComment: (formData: FormData) => Promise<AxiosResponse<IComment>>;
    onReplyAdded: (parentId: string) => void;
}

const CommentThread: React.FC<ThreadProps> = ({ comment, ...rest }) => {
    const { currentUser, onEdit, onDelete } = rest;
    const [localComment, setLocalComment] = useState(comment);
    const [replies, setReplies] = useState<IComment[]>([]);
    const [areRepliesVisible, setAreRepliesVisible] = useState(false);
    const [isLoadingReplies, setIsLoadingReplies] = useState(false);
    
    const [replyTarget, setReplyTarget] = useState<{
        comment: IComment,
        parentId: string | null,
        shouldTag: boolean;
    } | null>(null);

    const [shouldFocusReply, setShouldFocusReply] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [imageLoadTrigger, setImageLoadTrigger] = useState(0);
    const isReplying = !!replyTarget;

    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    const replyInputRef = useRef<HTMLDivElement>(null);
    const lineRef = useRef<HTMLDivElement>(null);
    const repliesContainerRef = useRef<HTMLDivElement>(null);
    const currentUserId = currentUser?._id || currentUser?.userId;

    const handleImageLoad = useCallback(() => {
        setImageLoadTrigger(count => count + 1);
    }, []);

    useEffect(() => { setLocalComment(comment); }, [comment]);

    useEffect(() => {
        if (replyTarget && shouldFocusReply && replyInputRef.current) {
            replyInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            replyInputRef.current.querySelector('textarea')?.focus();
            setShouldFocusReply(false);
        }
    }, [replyTarget, shouldFocusReply]);
    
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    useLayoutEffect(() => {
        const line = lineRef.current;
        const container = repliesContainerRef.current;
        if (!line || !container || !line.offsetParent) return;

        const allElements = container.querySelectorAll<HTMLElement>('.reply-item-container, .reply-input-container');
        if (allElements.length === 0) {
            line.style.height = '0px';
            return;
        }

        const lastElement = allElements[allElements.length - 1];
        const lineParent = line.offsetParent as HTMLElement;
        const lineContainerRect = lineParent.getBoundingClientRect();

        let requiredHeight = 0;

        if (lastElement.classList.contains('reply-input-container')) {
            const targetRect = lastElement.getBoundingClientRect();
            const hookOffsetY = 18; 
            const targetTopY = (targetRect.top - lineContainerRect.top) + hookOffsetY;
            requiredHeight = targetTopY - line.offsetTop;
        } else {
            const targetRect = lastElement.getBoundingClientRect();
            const targetCenterY = (targetRect.top - lineContainerRect.top) + (targetRect.height / 2);
            requiredHeight = targetCenterY - line.offsetTop;
        }

        line.style.height = `${Math.max(0, requiredHeight)}px`;
    }, [replies, areRepliesVisible, isReplying, editingCommentId, imageLoadTrigger, rest.hiddenCommentIds, windowSize]);

    const fetchReplies = useCallback(async () => {
        if (localComment.replyCount === 0) return;
        setIsLoadingReplies(true);
        try {
            const response = await API.get<IComment[]>(`/comments/${localComment._id}/replies`);
            setReplies(response.data);
        } catch (error) { console.error("Failed to fetch replies:", error); }
        finally { setIsLoadingReplies(false); }
    }, [localComment._id, localComment.replyCount]);

    useEffect(() => {
        if (areRepliesVisible && replies.length === 0 && localComment.replyCount > 0) {
            fetchReplies();
        }
    }, [areRepliesVisible, fetchReplies, replies.length, localComment.replyCount]);
    
    const handleSetReply = (targetComment: IComment, parentOfTarget: string | null, isDirectReplyAction: boolean = false) => {
        setReplyTarget({
            comment: targetComment,
            parentId: parentOfTarget,
            shouldTag: isDirectReplyAction
        });
        if (isDirectReplyAction) {
            setShouldFocusReply(true);
        }
    };


    const handleAddReply = async (content: string, imageFile: File | null) => {
        if (!replyTarget) return;

        const formData = new FormData();
        formData.append('content', content);
        if (imageFile) formData.append('commentImage', imageFile);
        formData.append('parentId', localComment._id);

        try {
            const response = await rest.onAddComment(formData);
            setReplies(currentReplies => [...currentReplies, response.data]);
            setLocalComment(prev => ({ ...prev, replyCount: prev.replyCount + 1 }));
            rest.onReplyAdded(localComment._id);
            if (!areRepliesVisible) setAreRepliesVisible(true);
            
            handleSetReply(localComment, null, false);
        } catch (error) {
            toast.error("Failed to add reply.");
        }
    };

    const handleDeleteReply = async (replyId: string) => {
        const success = await onDelete(replyId, localComment._id);
        if (success) {
            setReplies(prev => prev.filter(r => r._id !== replyId));
        }
    };

    const handleEditReply = async (replyId: string, newContent: string) => {
        const originalReplies = [...replies];

        setReplies(prevReplies => prevReplies.map(r =>
            r._id === replyId ? { ...r, content: newContent } : r
        ));
        setEditingCommentId(null);

        try {
            await onEdit(replyId, newContent);
        } catch (error) {
            setReplies(originalReplies);
            throw error;
        }
    };
    
    const getInitialReplyContent = () => {
        if (replyTarget && replyTarget.shouldTag && replyTarget.comment.user._id !== currentUserId) {
            const targetUsername = replyTarget.comment.user.username;
            return `@${targetUsername} `;
        }
        return '';
    };

    const visibleReplies = replies.filter(r => !rest.hiddenCommentIds.has(r._id));

    return (
        <div className="comment-thread-container">
            {(areRepliesVisible || isReplying || visibleReplies.length > 0) && <div ref={lineRef} className="thread-line-main" />}

            <CommentItem
                comment={localComment}
                isAuthor={localComment.user._id === currentUserId}
                isLiked={rest.likedCommentIds.has(localComment._id)}
                isEditing={editingCommentId === localComment._id}
                onStartEdit={() => setEditingCommentId(localComment._id)}
                onCancelEdit={() => setEditingCommentId(null)}
                onDelete={() => onDelete(localComment._id, null)}
                onEdit={async (newContent) => {
                    await onEdit(localComment._id, newContent);
                    setEditingCommentId(null);
                }}
                onSetReplyTarget={() => handleSetReply(localComment, null, true)}
                onLike={rest.onLike}
                onHide={rest.onHide}
                onImageLoad={handleImageLoad}
            />

            <div className="pl-12 pt-1 text-left">
                {!areRepliesVisible && localComment.replyCount > 0 && (
                    <Button
                        variant="link"
                        className="p-0 h-auto text-sm font-medium text-gray-600 dark:text-gray-400 hover:underline ml-3"
                        onClick={() => { setAreRepliesVisible(true); handleSetReply(localComment, null, false); }}
                        disabled={isLoadingReplies}
                    >
                        {isLoadingReplies ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : `View ${localComment.replyCount} ${localComment.replyCount > 1 ? 'replies' : 'reply'}`}
                    </Button>
                )}

                <div ref={repliesContainerRef} className='space-y-2'>
                    {areRepliesVisible && (
                        <div className="space-y-2 pt-2">
                            {visibleReplies.map(reply => (
                                <div key={reply._id} className="reply-item-container">
                                    <div className="reply-item-connector"></div>
                                    <CommentItem
                                        comment={reply}
                                        isAuthor={reply.user._id === currentUserId}
                                        isLiked={rest.likedCommentIds.has(reply._id)}
                                        isEditing={editingCommentId === reply._id}
                                        onStartEdit={() => setEditingCommentId(reply._id)}
                                        onCancelEdit={() => setEditingCommentId(null)}
                                        onDelete={() => handleDeleteReply(reply._id)}
                                        onEdit={(newContent) => handleEditReply(reply._id, newContent)}
                                        onSetReplyTarget={() => handleSetReply(reply, localComment._id, true)}
                                        onLike={rest.onLike}
                                        onHide={rest.onHide}
                                        onImageLoad={handleImageLoad}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                    {isReplying && (
                        <div ref={replyInputRef} className="pt-2 reply-input-container">
                            <div className="reply-input-connector"></div>
                            <ReplyInput
                                user={currentUser}
                                onSubmit={handleAddReply}
                                initialContent={getInitialReplyContent()}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommentThread;