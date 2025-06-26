import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { PlanService } from '../../src/services/plan.service';
import Plan from '../../src/models/plan.model';
import ItineraryItem from '../../src/models/itineraryItem.model';

// Mock các model
jest.mock('../../src/models/plan.model');
jest.mock('../../src/models/itineraryItem.model');

const mockedPlan = Plan as jest.Mocked<typeof Plan>;
const mockedItineraryItem = ItineraryItem as jest.Mocked<typeof ItineraryItem>;

describe('PlanService - Itinerary Item with DateTime', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    const mockUserId = new mongoose.Types.ObjectId().toHexString();
    const mockPlanId = new mongoose.Types.ObjectId().toHexString();
    const mockItemId = new mongoose.Types.ObjectId().toHexString();

    beforeEach(() => {
        jest.resetAllMocks();
        mockRequest = { params: {}, body: {}, user: mockUserId };
        mockResponse = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    });

    // =======================================================
    //  TESTS FOR addItineraryItem (POST)
    // =======================================================
    describe('addItineraryItem', () => {
        it('should add an item with full DateTime successfully', async () => {
            // Arrange
            const startTimeISO = '2025-08-01T09:00:00.000Z';
            mockRequest.params = { id: mockPlanId };
            mockRequest.body = {
                title: 'Morning Coffee',
                location: 'Highlands Coffee',
                category: 'dining',
                startTime: startTimeISO,
            };

            (mockedPlan.findById as jest.Mock).mockResolvedValue({ _id: mockPlanId, creator: mockUserId, save: jest.fn() });
            
            // FIX: Mock the chained '.sort()' method to prevent the TypeError
            (mockedItineraryItem.findOne as jest.Mock).mockReturnValue({
                sort: jest.fn().mockResolvedValue(null) // Giả lập không tìm thấy item nào, order sẽ là 1
            });

            const mockSave = jest.fn().mockResolvedValue(true);
            const capturedData: any = {};
            (mockedItineraryItem as unknown as jest.Mock).mockImplementation((data) => {
                Object.assign(capturedData, data);
                return { save: mockSave };
            });

            // Act
            await PlanService.addItineraryItem(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockSave).toHaveBeenCalled();
            expect(capturedData.startTime).toEqual(startTimeISO);
            expect(capturedData.order).toBe(1); // Kiểm tra logic tính order
            expect(mockResponse.status).toHaveBeenCalledWith(201);
        });

        it('should return 400 if required fields are missing', async () => {
            mockRequest.params = { id: mockPlanId };
            mockRequest.body = { title: 'Incomplete item' }; 

            await PlanService.addItineraryItem(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Title, location, category, and startTime are required.' });
        });
    });
    
    // =======================================================
    //  TESTS FOR getItineraryItemById (GET)
    // =======================================================
    describe('getItineraryItemById', () => {
        it('should retrieve an item successfully', async () => {
            mockRequest.params = { id: mockPlanId, itemId: mockItemId };
            const mockItemData = { _id: mockItemId, plan_id: mockPlanId, title: 'Test Item' };
            
            (mockedPlan.findById as jest.Mock).mockResolvedValue({ _id: mockPlanId, creator: mockUserId });
            (mockedItineraryItem.findOne as jest.Mock).mockResolvedValue(mockItemData);

            await PlanService.getItineraryItemById(mockRequest as Request, mockResponse as Response);

            expect(mockedItineraryItem.findOne).toHaveBeenCalledWith({ _id: mockItemId, plan_id: mockPlanId });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockItemData);
        });
    });

    // =======================================================
    //  TESTS FOR updateItineraryItem (PATCH)
    // =======================================================
    describe('updateItineraryItem', () => {
        it('should update an item startTime successfully', async () => {
            const newStartTimeISO = '2025-08-01T14:00:00.000Z';
            mockRequest.params = { id: mockPlanId, itemId: mockItemId };
            mockRequest.body = { startTime: newStartTimeISO };
            
            (mockedPlan.findById as jest.Mock).mockResolvedValue({ _id: mockPlanId, creator: mockUserId, save: jest.fn() });
            (mockedItineraryItem.findOneAndUpdate as jest.Mock).mockResolvedValue({
                _id: mockItemId,
                startTime: new Date(newStartTimeISO)
            });

            await PlanService.updateItineraryItem(mockRequest as Request, mockResponse as Response);

            const updatePayload = (mockedItineraryItem.findOneAndUpdate as jest.Mock).mock.calls[0][1].$set;
            expect(updatePayload.startTime).toBe(newStartTimeISO);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });
    });

    // =======================================================
    //  TESTS FOR deleteItineraryItem (DELETE)
    // =======================================================
    describe('deleteItineraryItem', () => {
        it('should delete an item successfully', async () => {
            mockRequest.params = { id: mockPlanId, itemId: mockItemId };
            (mockedPlan.findById as jest.Mock).mockResolvedValue({ _id: mockPlanId, creator: mockUserId });
            (mockedItineraryItem.findOneAndDelete as jest.Mock).mockResolvedValue({ _id: mockItemId }); 

            await PlanService.deleteItineraryItem(mockRequest as Request, mockResponse as Response);

            expect(mockedItineraryItem.findOneAndDelete).toHaveBeenCalledWith({ _id: mockItemId, plan_id: mockPlanId });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });
    });
});