import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TravelPlanService } from '../../src/services/travelPlan.service';
import TravelPlan from '../../src/models/travelPlan.model';
import { IPlanItem } from '../../src/models/travelPlan.model';

// Mock TravelPlan model
vi.mock('../../src/models/travelPlan.model');

const mockedTravelPlan = TravelPlan as any;

describe('TravelPlanService - Plan Item Management', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    const mockUserId = new mongoose.Types.ObjectId().toHexString();
    const mockPlanId = new mongoose.Types.ObjectId().toHexString();
    const mockItemId = new mongoose.Types.ObjectId(); // Keep as ObjectId for comparison

    // beforeEach function runs before each test
    beforeEach(() => {
        vi.resetAllMocks(); // Clear all old mocks
        mockRequest = { params: {}, body: {}, user: mockUserId };
        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
    });

    // ===================================
    //  TESTS FOR addPlanItem (POST)
    // ===================================
    describe('addPlanItem', () => {
        it('should add an item to a specific day successfully', async () => {
            // Arrange: Prepare data
            const newItemData = {
                type: 'activity',
                title: 'Thăm Cổng Tò Vò',
                startTime: '2025-07-20T17:00:00.000Z',
                endTime: '2025-07-20T18:00:00.000Z',
                cost: '0', // cost as string
                order: 1,
                location: {
                  placeId: 'abc123',
                  name: 'Cổng Tò Vò',
                  address: 'Lý Sơn',
                  coordinates: { lat: 15.4, lng: 109.1 }
                }
            };
            mockRequest.params = { id: mockPlanId, dayNumber: '1' };
            mockRequest.body = newItemData;

            const mockPlan = {
                _id: mockPlanId,
                author: mockUserId,
                schedule: [{
                    dayNumber: 1,
                    date: new Date('2025-07-20'),
                    items: [] as IPlanItem[],
                }],
                save: vi.fn().mockResolvedValue(true),
            };
            mockedTravelPlan.findOne.mockResolvedValue(mockPlan);

            // Act: Execute the function to test
            await TravelPlanService.addPlanItem(mockRequest.params.id, parseInt(mockRequest.params.dayNumber, 10), mockRequest.body, mockRequest.user as string);

            // Assert: Check the result
            expect(mockedTravelPlan.findOne).toHaveBeenCalledWith({ _id: mockPlanId, author: mockUserId });
            expect(mockPlan.save).toHaveBeenCalled();
            expect(mockPlan.schedule[0].items.length).toBe(1);
            expect(mockPlan.schedule[0].items[0].title).toBe(newItemData.title);
            expect(typeof mockPlan.schedule[0].items[0].cost).toBe('string');
            expect(mockPlan.schedule[0].items[0].order).toBe(1);
            expect(mockPlan.schedule[0].items[0].location).toEqual(newItemData.location);
        });

        it('should return an error if plan is not found', async () => {
            // Arrange
            mockedTravelPlan.findOne.mockResolvedValue(null);
            mockRequest.params = { id: mockPlanId, dayNumber: '1' };

            // Act & Assert
            await expect(
                TravelPlanService.addPlanItem(mockRequest.params.id, 1, {}, mockRequest.user as string)
            ).rejects.toThrow('Plan not found or user not authorized.');
        });
    });

    // ===================================
    //  TESTS FOR getPlanItem (GET)
    // ===================================
    describe('getPlanItem', () => {
        it('should retrieve a specific item successfully', async () => {
            // Arrange
            const mockItem = { _id: mockItemId, title: 'Test Item' };
            const mockPlan = {
                author: mockUserId,
                schedule: [{
                    dayNumber: 1,
                    items: [mockItem]
                }]
            };
            mockedTravelPlan.findOne.mockResolvedValue(mockPlan);

            // Act
            const result = await TravelPlanService.getPlanItem(mockPlanId, mockItemId.toHexString(), mockUserId);

            // Assert
            expect(mockedTravelPlan.findOne).toHaveBeenCalledWith({ _id: mockPlanId, author: mockUserId });
            expect(result).toBeDefined();
            expect(result?.title).toBe('Test Item');
        });
    });

    // ===================================
    //  TESTS FOR updatePlanItem (PUT)
    // ===================================
    describe('updatePlanItem', () => {
        it('should update an item successfully', async () => {
            // Arrange
            const updateData = { title: 'Updated Title', cost: '100000', order: 2 };
            const mockItem = { _id: mockItemId, title: 'Original Title', cost: '0', order: 1 };
            const mockPlan = {
                author: mockUserId,
                schedule: [{
                    dayNumber: 1,
                    items: [mockItem as IPlanItem]
                }],
                save: vi.fn().mockResolvedValue(true),
            };
            mockedTravelPlan.findOne.mockResolvedValue(mockPlan);

            // Act
            const result = await TravelPlanService.updatePlanItem(mockPlanId, mockItemId.toHexString(), updateData, mockUserId);

            // Assert
            expect(mockPlan.save).toHaveBeenCalled();
            expect(result?.title).toBe('Updated Title');
            expect(result?.cost).toBe('100000');
            expect(result?.order).toBe(2);
        });
    });

    // ===================================
    //  TESTS FOR deletePlanItem (DELETE)
    // ===================================
    describe('deletePlanItem', () => {
        it('should delete an item successfully', async () => {
            // Arrange
            const mockItem = { _id: mockItemId, title: 'To Be Deleted' };
            const mockPlan = {
                author: mockUserId,
                schedule: [{
                    dayNumber: 1,
                    items: [mockItem as IPlanItem]
                }],
                save: vi.fn().mockResolvedValue(true),
            };
            mockedTravelPlan.findOne.mockResolvedValue(mockPlan);

            // Act
            const result = await TravelPlanService.deletePlanItem(mockPlanId, mockItemId.toHexString(), mockUserId);

            // Assert
            expect(mockPlan.save).toHaveBeenCalled();
            expect(mockPlan.schedule[0].items.length).toBe(0); // Items array should now be empty
            expect(result).toBe(true);
        });
    });
});
