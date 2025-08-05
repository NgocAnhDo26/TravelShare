import mongoose, { Model, Types } from 'mongoose';
import Comment, { IComment } from '../models/comment.model';
import TravelPlan from '../models/travelPlan.model';
import Post from '../models/post.model';
import { Like } from '../models/like.model';
import User from '../models/user.model';

type TargetModelName = 'TravelPlan' | 'Post';

export interface ICommentLean {
  _id: Types.ObjectId;
  user: {
    _id: Types.ObjectId;
    username: string;
    displayName: string;
    avatarUrl: string;
  };
  content: string;
  targetId: Types.ObjectId;
  onModel: TargetModelName;
  parentId?: Types.ObjectId;
  likesCount: number;
  replyCount: number;
  mentions?: { _id: Types.ObjectId; username: string }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommentService {
  getCommentsForTarget(
    targetId: string,
    onModel: TargetModelName,
    page: number,
    limit: number
  ): Promise<{ comments: ICommentLean[]; totalPages: number; currentPage: number }>;
  getRepliesForComment(commentId: string): Promise<ICommentLean[]>;
  addComment(
    userId: string,
    targetId: string,
    onModel: TargetModelName,
    data: { content?: string; parentId?: string; imageUrl?: string }
  ): Promise<ICommentLean | null>;
  updateComment(commentId: string, userId: string, content: string): Promise<ICommentLean>;
  deleteComment(commentId: string, userId: string): Promise<void>;
  toggleLike(commentId: string, userId: string): Promise<ICommentLean | null>;
  getCommentById(commentId: string): Promise<ICommentLean | null>;
}

const TargetModelMap: Record<TargetModelName, Model<any>> = {
  TravelPlan,
  Post,
};

const CommentService: ICommentService = {
  async getCommentsForTarget(targetId, onModel, page, limit) {
    const skip = (page - 1) * limit;
    const comments = await Comment.find({ targetId, onModel, parentId: null })
      .populate({ path: 'user', select: 'username displayName avatarUrl _id' })
      .populate({ path: 'mentions', select: 'username _id' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalComments = await Comment.countDocuments({ targetId, onModel, parentId: null });

    return {
      comments: comments as unknown as ICommentLean[], // SỬA Ở ĐÂY: Dùng ép kiểu kép
      totalPages: Math.ceil(totalComments / limit),
      currentPage: page,
    };
  },

  async getRepliesForComment(commentId) {
    const replies = await Comment.find({ parentId: commentId })
      .populate({ path: 'user', select: 'username displayName avatarUrl _id' })
      .populate({ path: 'mentions', select: 'username _id' })
      .sort({ createdAt: 'asc' })
      .lean();
    return replies as unknown as ICommentLean[]; // SỬA Ở ĐÂY: Dùng ép kiểu kép
  },

  async addComment(userId, targetId, onModel, data) {
    const { content, parentId, imageUrl } = data;
    if (!content && !imageUrl) {
      throw new Error('Comment must have content or an image.');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const TargetModel = TargetModelMap[onModel];
      if (!TargetModel) {
        throw new Error(`Invalid onModel value: ${onModel}`);
      }
      const target = await TargetModel.findById(targetId).session(session);

      if (!target) {
        throw new Error(`${onModel} not found.`);
      }

      let mentionedUserIds: Types.ObjectId[] = [];
      if (content) {
        const mentionRegex = /@([a-zA-Z0-9_]+)/g;
        const mentionedUsernames = new Set<string>();
        let match;
        while ((match = mentionRegex.exec(content)) !== null) {
            mentionedUsernames.add(match[1]);
        }
        if (mentionedUsernames.size > 0) {
            const users = await User.find({ username: { $in: Array.from(mentionedUsernames) } }, '_id', { session });
            mentionedUserIds = users.map(u => u._id as Types.ObjectId);
        }
      }

      const comment = new Comment({
        content,
        targetId,
        onModel,
        user: userId,
        parentId,
        imageUrl,
        mentions: mentionedUserIds,
      });
      await comment.save({ session });

      if (parentId) {
        await Comment.updateOne({ _id: parentId }, { $inc: { replyCount: 1 } }, { session });
      } else {
        await TargetModel.updateOne({ _id: targetId }, { $inc: { commentsCount: 1 } }, { session });
      }

      await session.commitTransaction();
      return this.getCommentById((comment._id as Types.ObjectId).toString());
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  },

  async updateComment(commentId, userId, content) {
    if (!content) {
      throw new Error('Content is required.');
    }
    const updatedComment = await Comment.findOneAndUpdate(
      { _id: commentId, user: userId },
      { content },
      { new: true }
    )
    .populate({ path: 'user', select: 'username displayName avatarUrl _id' })
    .populate({ path: 'mentions', select: 'username _id' })
    .lean();

    if (!updatedComment) {
      throw new Error('Comment not found or you do not have permission to edit.');
    }
    return updatedComment as unknown as ICommentLean; // SỬA Ở ĐÂY: Dùng ép kiểu kép
  },

  async deleteComment(commentId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const comment = await Comment.findOne({ _id: commentId, user: userId }, null, { session });
      if (!comment) {
        throw new Error('Comment not found or you do not have permission to delete.');
      }
      if (comment.parentId) {
        await Comment.updateOne({ _id: comment.parentId }, { $inc: { replyCount: -1 } }, { session });
      } else {
        const modelToUpdate = TargetModelMap[comment.onModel as TargetModelName];
        await modelToUpdate.updateOne({ _id: comment.targetId }, { $inc: { commentsCount: -(1 + comment.replyCount) } }, { session });
      }
      await Comment.deleteMany({ parentId: commentId }, { session });
      await comment.deleteOne({ session });
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  },

  async toggleLike(commentId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const existingLike = await Like.findOne({ user: userId, targetId: commentId, onModel: 'Comment' }, null, { session });
      if (existingLike) {
        await existingLike.deleteOne({ session });
        await Comment.findByIdAndUpdate(commentId, { $inc: { likesCount: -1 } }, { session });
      } else {
        await Like.create([{ user: userId, targetId: commentId, onModel: 'Comment' }], { session });
        await Comment.findByIdAndUpdate(commentId, { $inc: { likesCount: 1 } }, { session });
      }
      await session.commitTransaction();
      return this.getCommentById(commentId);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  },

  async getCommentById(commentId) {
    const comment = await Comment.findById(commentId)
      .populate({ path: 'user', select: 'username displayName avatarUrl _id' })
      .populate({ path: 'mentions', select: 'username _id' })
      .lean();
    return comment as unknown as (ICommentLean | null); // SỬA Ở ĐÂY: Dùng ép kiểu kép
  },
};

export default CommentService;