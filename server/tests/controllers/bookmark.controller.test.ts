import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import app from '../../src/app';
import BookmarkService from '../../src/services/bookmark.service';
import AuthJwtMiddleware from '../../src/middlewares/authJwt';

vi.mock('../../src/services/bookmark.service');
vi.mock('../../src/middlewares/authJwt');

const mockBookmarkService = vi.mocked(BookmarkService);
const mockAuthMiddleware = vi.mocked(AuthJwtMiddleware);

mockAuthMiddleware.verifyToken.mockImplementation((req, res, next) => {
    (req as any).user = 'mockUserId';
    next();
});

describe('Bookmark Routes', () => {
    const mockUserId = 'mockUserId';
    const planId = new Types.ObjectId().toString();
    const postId = new Types.ObjectId().toString();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/plans/:id/bookmark and /api/posts/:id/bookmark', () => {
        it('should bookmark a TravelPlan and return { bookmarked: true }', async () => {
            mockBookmarkService.toggleBookmark.mockResolvedValue({ bookmarked: true });

            const response = await request(app)
                .post(`/api/plans/${planId}/bookmark`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ bookmarked: true });
            
            expect(mockBookmarkService.toggleBookmark).toHaveBeenCalledWith(
                mockUserId,
                planId,
                'TravelPlan'
            );
        });

        it('should unbookmark a Post and return { bookmarked: false }', async () => {
            mockBookmarkService.toggleBookmark.mockResolvedValue({ bookmarked: false });

            const response = await request(app)
                .post(`/api/posts/${postId}/bookmark`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ bookmarked: false });
            expect(mockBookmarkService.toggleBookmark).toHaveBeenCalledWith(
                mockUserId,
                postId,
                'Post'
            );
        });
    });

    // --- GET /api/bookmarks/me ---
    describe('GET /api/bookmarks/me', () => {
        it('should get all bookmarks for the current user', async () => {
            const mockBookmarkId = new Types.ObjectId();
            const serviceResponse = {
                bookmarks: [{ 
                    _id: mockBookmarkId, 
                    target: { title: 'My Plan' }, 
                    onModel: 'TravelPlan',
                    createdAt: new Date(),
                }],
                totalPages: 1,
                currentPage: 1,
            };
            mockBookmarkService.getBookmarksForUser.mockResolvedValue(serviceResponse as any);

            const response = await request(app)
                .get('/api/bookmarks/me?page=1&limit=10');

            expect(response.status).toBe(200);

            const expectedResponse = {
                ...serviceResponse,
                bookmarks: serviceResponse.bookmarks.map(b => ({
                    ...b,
                    _id: b._id.toString(),
                    createdAt: b.createdAt.toISOString(),
                })),
            };
            
            expect(response.body).toEqual(expectedResponse);
            expect(mockBookmarkService.getBookmarksForUser).toHaveBeenCalledWith(
                mockUserId, 'all', 1, 10
            );
        });

        it('should get filtered bookmarks for "plans"', async () => {
            mockBookmarkService.getBookmarksForUser.mockResolvedValue({
                bookmarks: [], totalPages: 0, currentPage: 1
            });

            await request(app).get('/api/bookmarks/me?filter=plans');

            expect(mockBookmarkService.getBookmarksForUser).toHaveBeenCalledWith(
                mockUserId, 'plans', 1, 10
            );
        });

        it('should return 400 for an invalid filter type', async () => {
            const response = await request(app)
                .get('/api/bookmarks/me?filter=invalid_filter');
            
            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: 'Invalid filter type.' });
            expect(mockBookmarkService.getBookmarksForUser).not.toHaveBeenCalled();
        });
    });

    // --- GET /api/bookmarks/me/ids ---
    describe('GET /api/bookmarks/me/ids', () => {
        it('should return an array of bookmarked target IDs', async () => {
            const mockIds = [new Types.ObjectId().toString(), new Types.ObjectId().toString()];
            mockBookmarkService.getBookmarkIdsForUser.mockResolvedValue(mockIds);

            const response = await request(app)
                .get('/api/bookmarks/me/ids');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockIds);
            expect(mockBookmarkService.getBookmarkIdsForUser).toHaveBeenCalledWith(mockUserId);
        });
    });
});