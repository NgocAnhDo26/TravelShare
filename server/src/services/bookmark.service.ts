import mongoose, { Model, Types } from 'mongoose';
import Bookmark, { IBookmark, SupportedModels } from '../models/bookmark.model';
import TravelPlan from '../models/travelPlan.model';
import Post from '../models/post.model';
import User from '../models/user.model';

const TargetModelMap: Record<SupportedModels, Model<any>> = {
  TravelPlan,
  Post,
};

export interface PopulatedBookmark {
  _id: Types.ObjectId;
  onModel: SupportedModels;
  target: any;
  createdAt: Date;
}

const BookmarkService = {
  async toggleBookmark(
    userId: string,
    targetId: string,
    onModel: SupportedModels,
  ): Promise<{ bookmarked: boolean }> {
    if (!TargetModelMap[onModel]) {
      throw new Error(`Invalid model for bookmarking: ${onModel}`);
    }

    const target = await TargetModelMap[onModel].findById(targetId);
    if (!target) {
      throw new Error(`${onModel} not found.`);
    }

    const existingBookmark = await Bookmark.findOne({
      user: userId,
      targetId: targetId,
      onModel: onModel,
    });

    if (existingBookmark) {
      await existingBookmark.deleteOne();
      return { bookmarked: false };
    } else {
      await Bookmark.create({
        user: userId,
        targetId: targetId,
        onModel: onModel,
      });
      return { bookmarked: true };
    }
  },

  async getBookmarksForUser(
    userId: string,
    filter: 'all' | 'plans' | 'posts',
    page: number,
    limit: number,
  ): Promise<{
    bookmarks: PopulatedBookmark[];
    totalPages: number;
    currentPage: number;
  }> {
    const query: any = { user: userId };
    if (filter === 'plans') {
      query.onModel = 'TravelPlan';
    } else if (filter === 'posts') {
      query.onModel = 'Post';
    }

    const skip = (page - 1) * limit;
    const totalBookmarks = await Bookmark.countDocuments(query);

    const bookmarks = await Bookmark.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('targetId')
      .lean();

    if (bookmarks.length > 0) {
      const targetsToPopulate = bookmarks
        .map((b) => b.targetId)
        .filter(Boolean);

      if (targetsToPopulate.length > 0) {
        await User.populate(targetsToPopulate, {
          path: 'author',
          select: 'displayName username avatarUrl',
        });
      }
    }
    
    return {
      bookmarks: bookmarks.map(b => ({
        _id: b._id,
        onModel: b.onModel,
        target: b.targetId,
        createdAt: b.createdAt,
      })) as PopulatedBookmark[],
      totalPages: Math.ceil(totalBookmarks / limit),
      currentPage: page,
    };
  },

  async getBookmarkIdsForUser(userId: string): Promise<string[]> {
    const bookmarks = await Bookmark.find({ user: userId }).select('targetId');
    return bookmarks.map(bookmark => bookmark.targetId.toString());
  },
};

export default BookmarkService;
