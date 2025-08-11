import { describe, it, expect, beforeEach } from 'vitest';
import mongoose, { Types } from 'mongoose';
import BookmarkService from '../../src/services/bookmark.service';
import User from '../../src/models/user.model';
import TravelPlan from '../../src/models/travelPlan.model';
import Post from '../../src/models/post.model';
import Bookmark from '../../src/models/bookmark.model';

if (!mongoose.models.Post) {
    mongoose.model('Post', Post.schema);
}

describe('Bookmark Service', () => {
    let testUser: any;
    let testPlan: any;
    let testPost: any;

    beforeEach(async () => {
        testUser = await User.create({
            email: 'bookmark.user@example.com',
            username: 'bookmarkuser',
            passwordHash: 'somehash'
        });

        testPlan = await TravelPlan.create({
            title: 'Test Plan for Bookmarking',
            author: testUser._id,
            destination: {
                name: 'Paris',
                address: 'Paris, France'
            }
        });

        testPost = await Post.create({
            title: 'Test Post for Bookmarking',
            authorID: testUser._id,
            content: 'This is a valid post content that is long enough.'
        });
    });

    describe('toggleBookmark', () => {
        it('should create a bookmark if one does not exist and return { bookmarked: true }', async () => {
            const result = await BookmarkService.toggleBookmark(
                testUser._id.toString(),
                testPlan._id.toString(),
                'TravelPlan'
            );

            expect(result.bookmarked).toBe(true);

            const bookmarkInDb = await Bookmark.findOne({
                user: testUser._id,
                targetId: testPlan._id
            });
            expect(bookmarkInDb).not.toBeNull();
            expect(bookmarkInDb?.onModel).toBe('TravelPlan');
        });

        it('should remove a bookmark if one already exists and return { bookmarked: false }', async () => {
            await Bookmark.create({
                user: testUser._id,
                targetId: testPlan._id,
                onModel: 'TravelPlan'
            });

            const result = await BookmarkService.toggleBookmark(
                testUser._id.toString(),
                testPlan._id.toString(),
                'TravelPlan'
            );

            expect(result.bookmarked).toBe(false);
            
            const bookmarkInDb = await Bookmark.findOne({
                user: testUser._id,
                targetId: testPlan._id
            });
            expect(bookmarkInDb).toBeNull();
        });

        it('should throw an error if the target to be bookmarked does not exist', async () => {
            const nonExistentId = new Types.ObjectId().toString();

            await expect(
                BookmarkService.toggleBookmark(
                    testUser._id.toString(),
                    nonExistentId,
                    'Post'
                )
            ).rejects.toThrow('Post not found.');
        });
    });

    describe('getBookmarksForUser', () => {
        beforeEach(async () => {
            await Bookmark.create([
                { user: testUser._id, targetId: testPlan._id, onModel: 'TravelPlan' },
                { user: testUser._id, targetId: testPost._id, onModel: 'Post' }
            ]);
        });

        it('should retrieve all bookmarks for a user with populated data', async () => {
            const result = await BookmarkService.getBookmarksForUser(testUser._id.toString(), 'all', 1, 10);

            expect(result.bookmarks.length).toBe(2);
            expect(result.totalPages).toBe(1);
            expect(result.currentPage).toBe(1);

            const planBookmark = result.bookmarks.find(b => b.onModel === 'TravelPlan');
            expect(planBookmark?.target.title).toBe('Test Plan for Bookmarking');
            expect(planBookmark?.target.author.username).toBe('bookmarkuser');
        });

        it('should filter bookmarks by "plans"', async () => {
            const result = await BookmarkService.getBookmarksForUser(testUser._id.toString(), 'plans', 1, 10);

            expect(result.bookmarks.length).toBe(1);
            expect(result.bookmarks[0].onModel).toBe('TravelPlan');
        });

        it('should correctly handle pagination', async () => {
            const anotherPost = await Post.create({ 
                title: 'Another Post', 
                authorID: testUser._id, 
                content: 'This content is definitely long enough.'
            });
            await Bookmark.create({ user: testUser._id, targetId: anotherPost._id, onModel: 'Post' });

            const page1 = await BookmarkService.getBookmarksForUser(testUser._id.toString(), 'all', 1, 2);
            expect(page1.bookmarks.length).toBe(2);
            expect(page1.totalPages).toBe(2);

            const page2 = await BookmarkService.getBookmarksForUser(testUser._id.toString(), 'all', 2, 2);
            expect(page2.bookmarks.length).toBe(1);
        });
    });

    describe('getBookmarkIdsForUser', () => {
        it('should return a flat array of targetId strings', async () => {
            await Bookmark.create([
                { user: testUser._id, targetId: testPlan._id, onModel: 'TravelPlan' },
                { user: testUser._id, targetId: testPost._id, onModel: 'Post' }
            ]);

            const result = await BookmarkService.getBookmarkIdsForUser(testUser._id.toString());
            
            expect(result.length).toBe(2);
            expect(result).toEqual(expect.arrayContaining([
                testPlan._id.toString(),
                testPost._id.toString()
            ]));
        });
    });
});