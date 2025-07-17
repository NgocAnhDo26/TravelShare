import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TravelPlanService } from '../../src/services/travelPlan.service';
import TravelPlan from '../../src/models/travelPlan.model';
import { IPlanItem } from '../../src/models/travelPlan.model';

// Giả lập (mock) model TravelPlan
jest.mock('../../src/models/travelPlan.model');

jest.mock('../../src/config/supabase.config', () => ({
  __esModule: true,
  default: {
    storage: {
      from: () => ({
        remove: jest.fn().mockResolvedValue({ error: null }),
      }),
    },
  },
}));

const mockedTravelPlan = TravelPlan as jest.Mocked<typeof TravelPlan>;

describe('TravelPlanService - Plan Item Management', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    const mockUserId = new mongoose.Types.ObjectId().toHexString();
    const mockPlanId = new mongoose.Types.ObjectId().toHexString();
    const mockItemId = new mongoose.Types.ObjectId(); // Giữ ở dạng ObjectId để so sánh

    // Hàm beforeEach sẽ chạy trước mỗi bài test
    beforeEach(() => {
        jest.resetAllMocks(); // Xóa tất cả các mock cũ
        mockRequest = { params: {}, body: {}, user: mockUserId };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    // ===================================
    //  TESTS FOR addPlanItem (POST)
    // ===================================
    describe('addPlanItem', () => {
        it('should add an item to a specific day successfully', async () => {
            // Arrange: Chuẩn bị dữ liệu
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
                save: jest.fn().mockResolvedValue(true),
            };
            (mockedTravelPlan.findOne as jest.Mock).mockResolvedValue(mockPlan);

            // Act: Thực thi hàm cần test
            await TravelPlanService.addPlanItem(mockRequest.params.id, parseInt(mockRequest.params.dayNumber, 10), mockRequest.body, mockRequest.user as string);

            // Assert: Kiểm tra kết quả
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
            (mockedTravelPlan.findOne as jest.Mock).mockResolvedValue(null);
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
            (mockedTravelPlan.findOne as jest.Mock).mockResolvedValue(mockPlan);

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
                save: jest.fn().mockResolvedValue(true),
            };
            (mockedTravelPlan.findOne as jest.Mock).mockResolvedValue(mockPlan);

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
                save: jest.fn().mockResolvedValue(true),
            };
            (mockedTravelPlan.findOne as jest.Mock).mockResolvedValue(mockPlan);

            // Act
            const result = await TravelPlanService.deletePlanItem(mockPlanId, mockItemId.toHexString(), mockUserId);

            // Assert
            expect(mockPlan.save).toHaveBeenCalled();
            expect(mockPlan.schedule[0].items.length).toBe(0); // Mảng items giờ phải rỗng
            expect(result).toBe(true);
        });
    });
});
